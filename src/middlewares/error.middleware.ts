import { Request, Response, NextFunction } from "express";
import omit from "lodash/omit";
import HTTP_STATUS_CODE from "../constants/httpStatusCode";
import { ErrorsWithStatus } from "../models/Error";

export const defaultErrorHandle = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorsWithStatus) {
    res.status(err.status).json(omit(err, ["status"]));
    return;
  }
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });
  res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    error_info: omit(err, ["stack"]),
  });
  return;
};
