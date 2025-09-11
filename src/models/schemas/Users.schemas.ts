import { ObjectId } from "mongodb";
import { UserVerifyStatus } from "../../constants/enums";

interface UserType {
  _id?: ObjectId;
  email: string;
  username: string;
  password: string;
  verify: UserVerifyStatus;
  createdAt?: Date;
  updatedAt?: Date;
  email_verify_token: string;
  forgot_password_token: string;
}

export class User {
  _id?: ObjectId;
  email: string;
  username: string;
  password: string;
  verify: UserVerifyStatus;
  createdAt?: Date;
  updatedAt?: Date;
  email_verify_token: string;
  forgot_password_token: string;
  constructor(user: UserType) {
    const date = new Date();
    this._id = user._id;
    this.email = user.email;
    this.username = user.username;
    this.password = user.password;
    this.verify = user.verify || UserVerifyStatus.Unverified;
    this.createdAt = user.createdAt || date;
    this.updatedAt = user.updatedAt || date;
    this.email_verify_token = user.email_verify_token || "";
    this.forgot_password_token = user.forgot_password_token || "";
  }
}
