import { NextFunction, Request, Response } from "express";
import { ValidationChain, validationResult } from "express-validator";
import { RunnableValidationChains } from "express-validator/lib/middlewares/schema";
import HTTP_STATUS_CODE from "../constants/httpStatusCode";
import { ErrorsEntity, ErrorsWithStatus } from "../models/Error";

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req);
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const errorsObject = errors.mapped();

    for (const key in errorsObject) {
      const { msg } = errorsObject[key];
      if (msg instanceof ErrorsWithStatus && msg.status !== HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }
    }

    const entityErrorsObject = new ErrorsEntity({
      message: "Validation Error!",
      errors: errorsObject,
    });
    next(entityErrorsObject);
  };
};
