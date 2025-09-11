import { signToken } from "../utils/jwt";
import { UserVerifyStatus, TokenType } from "../constants/enums";
import type { StringValue } from "ms";
import { verifyToken } from "../utils/jwt";
import databaseService from "./database.service";
import { RegisterReqBody } from "../models/dto/User.requests";
import { ObjectId } from "mongodb";
import { User } from "../models/schemas/Users.schemas";
import { hashPassword } from "../utils/crypto";
import RefreshToken from "../models/schemas/RefreshToken.schemas";
import { verifySendMail, resetPasswordSendMail } from "../utils/sendmail";
import { USER_MESSAGE } from "../constants/messages";
class UserService {
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }

  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify,
      },
      privateKey: process.env.ACCESS_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue,
      },
    });
  }

  private signRefreshToken({
    user_id,
    verify,
    exp,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    exp?: number;
  }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp,
        },
        privateKey: process.env.REFRESH_TOKEN_SECRET as string,
      });
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify,
      },
      privateKey: process.env.REFRESH_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue,
      },
    });
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify,
      },
      privateKey: process.env.EMAIL_VERIFY_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as StringValue,
      },
    });
  }

  private signForgotPasswordToken({
    user_id,
    verify,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify,
      },
      privateKey: process.env.FORGOT_PASSWORD_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue,
      },
    });
  }
  async forgotPassword({
    user_id,
    verify,
    email,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    email: string;
  }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify });
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        $set: {
          forgot_password_token,
        },
        $currentDate: {
          updated_at: true,
        },
      }
    );
    await resetPasswordSendMail({
      email,
      subject: `Forgot password token email`,
      token: forgot_password_token,
    });
    return {
      message: USER_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD,
    };
  }
  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id),
      },
      [
        {
          $set: {
            forgot_password_token: "",
            password: hashPassword(password),
            updated_at: "$$NOW",
          },
        },
      ]
    );
    return {
      message: USER_MESSAGE.RESET_PASSWORD_SUCCESS,
    };
  }
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.REFRESH_TOKEN_SECRET as string,
    });
  }

  private signAccessTokenRefreshToken({
    user_id,
    verify,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
  }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify }),
    ]);
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const [tokens, email_verify_token] = await Promise.all([
      this.signAccessTokenRefreshToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Unverified,
      }),
      this.signEmailVerifyToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Unverified,
      }),
    ]);
    const [access_token, refresh_token] = tokens;
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);

    await Promise.all([
      databaseService.users.insertOne(
        new User({
          ...payload,
          _id: user_id,
          email_verify_token,
          username: `username${user_id.toString()}`,
          password: hashPassword(payload.password),
          verify: UserVerifyStatus.Unverified,
          forgot_password_token: "",
        })
      ),
      databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id,
          token: refresh_token,
          iat,
          exp,
        })
      ),
    ]);
    await verifySendMail({
      email: payload.email,
      subject: `Verify your email`,
      token: email_verify_token,
    });
    return {
      access_token,
      refresh_token,
    };
  }
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessTokenRefreshToken({
      user_id,
      verify,
    });
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat,
        exp,
      })
    );
    return {
      access_token,
      refresh_token,
    };
  }
  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    refresh_token: string;
    exp: number;
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token }),
    ]);
    const decode_refresh_token = await this.decodeRefreshToken(new_refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decode_refresh_token.iat,
        exp: decode_refresh_token.exp,
      })
    );

    return {
      message: USER_MESSAGE.REFRESH_TOKEN_SUCCESS,
      data: {
        new_access_token,
        new_refresh_token,
      },
    };
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });
    return {
      message: USER_MESSAGE.LOGOUT_SUCCESS,
    };
  }
  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signAccessTokenRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id),
        },
        {
          $set: {
            email_verify_token: "",
            verify: UserVerifyStatus.Verified,
          },
          $currentDate: {
            updated_at: true,
          },
        }
      ),
    ]);
    const [access_token, refresh_token] = tokens;
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat,
        exp,
      })
    );
    return {
      message: USER_MESSAGE.EMAIL_VERIFY_SUCCESS,
      data: {
        access_token,
        refresh_token,
      },
    };
  }
}

const userService = new UserService();
export default userService;
