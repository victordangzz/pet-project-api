import { Request, Response, NextFunction } from "express";
import { ParamSchema, validationResult, checkSchema } from "express-validator";
import { USER_MESSAGE } from "../constants/messages";
import { UserVerifyStatus } from "../constants/enums";
import { ObjectId } from "mongodb";
import databaseService from "../services/database.service";
import HTTP_STATUS_CODE from "../constants/httpStatusCode";
import { ErrorsWithStatus } from "../models/Error";
import { validate } from "../utils/validation";
import { hashPassword } from "../utils/crypto";
import userService from "../services/user.service";
import { verifyToken } from "../utils/jwt";
import { JsonWebTokenError } from "jsonwebtoken";
import { capitalize } from "lodash";
import { verifyAccessToken } from "../utils/common";
import { TokenPayLoad } from "~/models/dto/User.requests";
const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.EMAIL_IS_REQUIRED,
  },
  isEmail: {
    errorMessage: USER_MESSAGE.EMAIL_INVALID,
  },
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 100,
    },
    errorMessage: USER_MESSAGE.EMAIL_MUST_BE_FROM_6_TO_100,
  },
};

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.PASSWORD_IS_REQUIRED,
  },
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 50,
    },
    errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_FROM_6_TO_100,
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    errorMessage: USER_MESSAGE.PASSWORD_IS_NOT_STRONG,
  },
};

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.NAME_IS_REQUIRED,
  },
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 100,
    },
    errorMessage: USER_MESSAGE.NAME_MUST_BE_FROM_6_TO_100,
  },
};
const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorsWithStatus({
          message: USER_MESSAGE.USER_ID_INVALID,
          status: HTTP_STATUS_CODE.BAD_REQUEST,
        });
      }
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value),
      });
      if (followed_user === null) {
        throw new ErrorsWithStatus({
          message: USER_MESSAGE.USER_NOT_FOUND,
          status: HTTP_STATUS_CODE.NOT_FOUND,
        });
      }
      return true;
    },
  },
};
const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorsWithStatus({
          message: USER_MESSAGE.FORGOT_PASSWORD_IS_REQUIRED,
          status: HTTP_STATUS_CODE.UNAUTHORIZED,
        });
      }
      try {
        const decode_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.FORGOT_PASSWORD_TOKEN_SECRET as string,
        });
        const { user_id } = decode_forgot_password_token;
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
        if (user === null) {
          throw new ErrorsWithStatus({
            message: USER_MESSAGE.USER_NOT_FOUND,
            status: HTTP_STATUS_CODE.UNAUTHORIZED,
          });
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorsWithStatus({
            message: USER_MESSAGE.FORGOT_PASSWORD_TOKEN_INVALID,
            status: HTTP_STATUS_CODE.UNAUTHORIZED,
          });
        }
        (req as Request).decode_forgot_password_token = decode_forgot_password_token;
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorsWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS_CODE.UNAUTHORIZED,
          });
        }
        throw error;
      }
      return true;
    },
  },
};

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
            });
            if (user === null) {
              throw new Error(USER_MESSAGE.USER_NOT_FOUND);
            }
            req.user = user;
            return true;
          },
        },
      },
    },
    ["body"]
  )
);

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
    },
    ["body"]
  )
);

export const resetPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH);
            }
            return true;
          },
        },
      },
    },
    ["body"]
  )
);


export const loginValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password),
            });
            if (user === null) {
              throw new Error(USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT);
            }
            if (user.verify !== UserVerifyStatus.Verified) {
              throw new Error(USER_MESSAGE.EMAIL_NOT_VERIFIED);
            }

            req.user = user;
            return true;
          },
        },
      },
      password: passwordSchema,
    },
    ["body"]
  )
);
export const registerValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value) => {
            const result = await userService.checkEmailExist(value);
            if (result) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS_CODE.CONFLICT,
              });
            }
            return true;
          },
        },
      },
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH);
            }
            return true;
          },
        },
      },
    },
    ["body"]
  )
);
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS_CODE.UNAUTHORIZED,
              });
            }
            try {
              const [decode_refresh_token, refresh_token] = await Promise.all([
                verifyToken({
                  token: value,
                  secretOrPublicKey: process.env.REFRESH_TOKEN_SECRET as string,
                }),
                databaseService.refreshTokens.findOne({ token: value }),
              ]);
              if (refresh_token === null) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.REFRESH_TOKEN_IS_NOT_EXISTS,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED,
                });
              }
              (req as Request).decode_refresh_token = decode_refresh_token;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorsWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS_CODE.UNAUTHORIZED,
                });
              }
              throw error;
            }
            return true;
          },
        },
      },
    },
    ["body"]
  )
);

export const verifyEmailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS_CODE.UNAUTHORIZED,
              });
            }
            try {
              const decode_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.EMAIL_VERIFY_TOKEN_SECRET as string,
              });
              const { user_id } = decode_email_verify_token;
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
              if (user === null) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.USER_NOT_FOUND,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED,
                });
              }
              if (user.email_verify_token !== value) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_INVALID,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED,
                });
              }
              if (user.email_verify_token === "") {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.EMAIL_IS_VERIFIED,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED,
                });
              }
              (req as Request).decode_email_verify_token = decode_email_verify_token;
            } catch (error) {
              throw new ErrorsWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS_CODE.UNAUTHORIZED,
              });
            }
            return true;
          },
        },
      },
    },
    ["body"]
  )
);
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            return await verifyAccessToken(access_token, req as Request)
          }
        }
      }
    },
    ['headers']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decode_authorization as TokenPayLoad
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorsWithStatus({
        message: USER_MESSAGE.VERIFY_USER_INVALID,
        status: HTTP_STATUS_CODE.FORBIDDEN
      })
    )
  }
  next()
}