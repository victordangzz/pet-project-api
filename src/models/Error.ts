import HTTP_STATUS_CODE from "../constants/httpStatusCode";

type ErrorsType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorsWithStatus {
  message: string;
  status: number;
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message;
    this.status = status;
  }
}

export class ErrorsEntity extends ErrorsWithStatus {
  errors: ErrorsType;
  constructor({ message = "Validation Error!", errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY });
    this.errors = errors;
  }
}
