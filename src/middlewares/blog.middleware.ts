import { validate } from "../utils/validation";
import { checkSchema, ParamSchema } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import databaseService from "../services/database.service";
import { ErrorsWithStatus } from "../models/Error";
import HTTP_STATUS_CODE from "../constants/httpStatusCode";
import { TokenPayLoad } from "../models/dto/User.requests";
import { BlogStatus } from "../constants/enums";
import { BLOG_MESSAGE } from "../constants/messages";

const title: ParamSchema = {
  isString: { errorMessage: BLOG_MESSAGE.TITLE_IS_REQUIRED },
  notEmpty: { errorMessage: BLOG_MESSAGE.TITLE_IS_REQUIRED },
  isLength: {
    options: { min: 3, max: 200 },
    errorMessage: BLOG_MESSAGE.TITLE_LENGTH,
  },
  trim: true,
  escape: true,
};

const content: ParamSchema = {
  isString: { errorMessage: BLOG_MESSAGE.CONTENT_IS_REQUIRED },
  notEmpty: { errorMessage: BLOG_MESSAGE.CONTENT_IS_REQUIRED },
  isLength: {
    options: { min: 10 },
    errorMessage: BLOG_MESSAGE.CONTENT_LENGTH,
  },
  trim: true,
  escape: true,
};

const blogIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: "Blog ID is required",
  },
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorsWithStatus({
          message: BLOG_MESSAGE.BLOG_ID_INVALID,
          status: HTTP_STATUS_CODE.BAD_REQUEST,
        });
      }
      const blog = await databaseService.blogs.findOne({
        _id: new ObjectId(value),
        isDeleted: false,
      });
      if (!blog) {
        throw new ErrorsWithStatus({
          message: BLOG_MESSAGE.BLOG_NOT_FOUND,
          status: HTTP_STATUS_CODE.NOT_FOUND,
        });
      }
      (req as any).blog = blog;
      return true;
    },
  },
};

const statusSchema: ParamSchema = {
  optional: true,
  isIn: {
    options: [Object.values(BlogStatus)],
    errorMessage: BLOG_MESSAGE.INVALID_STATUS,
  },
};

const tagsSchema: ParamSchema = {
  optional: true,
  isArray: {
    errorMessage: BLOG_MESSAGE.INVALID_TAGS,
  },
  custom: {
    options: (value: string[]) => {
      if (value && Array.isArray(value)) {
        return value.every((tag) => typeof tag === "string" && tag.trim().length > 0);
      }
      return true;
    },
    errorMessage: BLOG_MESSAGE.INVALID_TAGS,
  },
};

export const createBlogValidator = validate(
  checkSchema({
    title: {
      ...title,
    },
    content: {
      ...content,
    },
    status: {
      ...statusSchema,
    },
    tags: {
      ...tagsSchema,
    },
  })
);

export const updateBlogValidator = validate(
  checkSchema(
    {
      id: {
        ...blogIdSchema,
      },
    },
    ["params"]
  )
);

export const updateBlogBodyValidator = validate(
  checkSchema({
    title: {
      ...title,
      optional: true,
    },
    content: {
      ...content,
      optional: true,
    },
    status: {
      ...statusSchema,
    },
    tags: {
      ...tagsSchema,
    },
  })
);

export const getBlogValidator = validate(
  checkSchema(
    {
      blog_id: {
        ...blogIdSchema,
      },
    },
    ["params"]
  )
);

export const deleteBlogValidator = validate(
  checkSchema(
    {
      blog_id: {
        ...blogIdSchema,
      },
    },
    ["params"]
  )
);

// Middleware to check if user is the author of the blog
export const checkBlogOwnership = (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayLoad;
  const blog = req.blog;

  if (!blog) {
    return next(
      new ErrorsWithStatus({
        message: BLOG_MESSAGE.BLOG_NOT_FOUND,
        status: HTTP_STATUS_CODE.NOT_FOUND,
      })
    );
  }

  if (blog.authorId.toString() !== user_id) {
    return next(
      new ErrorsWithStatus({
        message: BLOG_MESSAGE.BLOG_PERMISSION_DENIED,
        status: HTTP_STATUS_CODE.FORBIDDEN,
      })
    );
  }

  next();
};
