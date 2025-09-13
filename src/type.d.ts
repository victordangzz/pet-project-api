import { Request } from "express";
import { User } from "./models/schemas/Users.schemas";
import { TokenPayLoad } from "./models/dto/User.requests";
import { WithId, Document } from "mongodb";

declare module "express" {
  interface Request {
    user?: User;
    blog?: WithId<Document>;
    decode_authorization?: TokenPayLoad;
    decode_refresh_token?: TokenPayLoad;
    decode_email_verify_token?: TokenPayLoad;
    decode_forgot_password_token?: TokenPayLoad;
  }
}
