import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { User } from "../models/schemas/Users.schemas";
import { LoginReqBody, LogoutReqBody } from "../models/dto/User.requests";
import { ObjectId } from "mongodb";
import userService from "../services/user.service";
import { USER_MESSAGE } from "../constants/messages";
import { RegisterReqBody } from "../models/dto/User.requests";
import { VerifyEmailTokenReqBody } from "../models/dto/User.requests";
import { NextFunction } from "express";
import { ForgotPasswordReqBody } from "../models/dto/User.requests";
import { VerifyForgotPasswordReqBody } from "../models/dto/User.requests";
import { ResetPasswordReqBody } from "../models/dto/User.requests";
import { TokenPayLoad } from "../models/dto/User.requests";
import RefreshToken from "~/models/schemas/RefreshToken.schemas";
import { RefreshTokenReqBody } from "../models/dto/User.requests";
export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response
) => {
  const user = req.user as User;
  const verify = user.verify;
  
  const user_id = user._id as ObjectId;
  const response = await userService.login({ user_id: user_id.toString(), verify });
  res.json({
    message: USER_MESSAGE.LOGIN_SUCCESS,
    data: {
      ...response,
      user,
    },
  });
  console.log(response);
  console.log(user);
  return;
};

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response
) => {
  const response = await userService.register(req.body);
  res.json({
    message: USER_MESSAGE.REGISTER_SUCCESS,
    data: response,
  });
  return;
};

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { user_id, verify, exp } = req.decode_refresh_token as TokenPayLoad
  const { refresh_token } = req.body
  const response = await userService.refreshToken({ user_id, verify, refresh_token, exp })
  res.json(response)
  return
};

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response
) => {
  const refresh_token = req.body.refresh_token;
  const response = await userService.logout(refresh_token);
  res.json({
    message: USER_MESSAGE.LOGOUT_SUCCESS,
    data: response,
  });
  
  return;
};

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailTokenReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_email_verify_token as TokenPayLoad;
  const response = await userService.verifyEmail(user_id);
  res.json(response);
  return;
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, verify, email } = req.user as User
  const response = await userService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify, email })
  res.json(response)
  return
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response
) => {
  res.json({
    message: USER_MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
  return
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_forgot_password_token as TokenPayLoad
  const { password } = req.body
  const response = await userService.resetPassword({ user_id, password })
  res.json(response)
  return
}
