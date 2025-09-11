import { JwtPayload } from "jsonwebtoken";
import { TokenType, UserVerifyStatus } from "../../constants/enums";
import { ParamsDictionary } from "express-serve-static-core";

export interface RegisterReqBody {
  email: string;
  password: string;
  confirm_password: string;
}
export interface LoginReqBody {
  email: string;
  password: string;
}
export interface RefreshTokenReqBody {
  refresh_token: string;
}

export interface TokenPayLoad extends JwtPayload {
  user_id: string;
  token_type: TokenType;
  verify: UserVerifyStatus;
  iat: number;
  exp: number;
}

export interface LogoutReqBody {
  refresh_token: string;
}

export interface VerifyEmailTokenReqBody {
  email_verify_token: string;
}
export interface ForgotPasswordReqBody {
  email: string;
}

export interface VerifyForgotPasswordReqBody {
  forgot_password_token: string;
}

export interface ResetPasswordReqBody {
  forgot_password_token: string;
  password: string;
  confirm_password: string;
}
