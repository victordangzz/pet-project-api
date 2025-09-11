import { Router } from "express";
import { PATH } from "../constants/path";
import {
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyEmailTokenValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator,
} from "../middlewares/user.middleware";
import { wrapRequestHandler } from "../utils/handlers";
import { loginController } from "../controllers/user.controller";
import { registerController } from "../controllers/user.controller";
import { verifyEmailController } from "../controllers/user.controller";
import { logoutController } from "../controllers/user.controller";
import { refreshTokenController } from "../controllers/user.controller";
import { forgotPasswordController } from "../controllers/user.controller";
import { verifyForgotPasswordController } from "../controllers/user.controller";
import { resetPasswordController } from "../controllers/user.controller";
const usersRouter = Router();

/**
 * Description route: Login user
 * Path: /login
 * Method: POST
 * Request body: { email:string, password:string }
 * */
usersRouter.post(PATH.LOGIN, loginValidator, wrapRequestHandler(loginController));

/**
 * Description route: Register user
 * Path: /register
 * Method: POST
 * Request body: { email:string, password:string }
 * */
usersRouter.post(PATH.REGISTER, registerValidator, wrapRequestHandler(registerController));

/**
 * Description route: Verify email
 * Path: /verify-email
 * Method: POST
 * Request body: { email_verify_token:string }
 * */
usersRouter.post(
  PATH.VERIFY_EMAIL,
  verifyEmailTokenValidator,
  wrapRequestHandler(verifyEmailController)
);
/**
 * Description route: Refresh token
 * Path: /refresh-token
 * Method: POST
 * Request body: { refresh_token:string }
 * */
usersRouter.post(
  PATH.REFRESH_TOKEN,
  refreshTokenValidator,
  wrapRequestHandler(refreshTokenController)
);

/**
 * Description route: Logout user
 * Path: /logout
 * Method: POST
 * Request body: { refresh_token:string }
 * */
usersRouter.post(PATH.LOGOUT, refreshTokenValidator, wrapRequestHandler(logoutController));

/**
 * Description route: Submit email to reset password, send email to user
 * Path: /forgot-password
 * Method: POST
 * Request body: { email: string }
 * */
usersRouter.post(
  PATH.FORGOT_PASSWORD,
  forgotPasswordValidator,
  wrapRequestHandler(forgotPasswordController)
);

/**
 * Description route: Verify link in email to reset password
 * Path: /verify-forgot-password
 * Method: POST
 * Request body: { forgot_password_token: string }
 * */
usersRouter.post(
  PATH.VERIFY_FORGOT_PASSWORD,
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController)
);

/**
 * Description route: Reset password when user subform forgot password
 * Path: /reset-password
 * Method: POST
 * Request body: { forgot_password_token: string, password: string, confirm_password: string }
 * */
usersRouter.post(
  PATH.RESET_PASSWORD,
  resetPasswordValidator,
  wrapRequestHandler(resetPasswordController)
);

export default usersRouter;
