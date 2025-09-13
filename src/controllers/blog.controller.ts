import { CreateBlogReqBody, UpdateBlogReqBody } from "../models/dto/Blog.requests";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ObjectId } from "mongodb";
import blogService from "../services/blog.service";
import { Blogs } from "../models/schemas/Blogs.schemas";
import { TokenPayLoad } from "../models/dto/User.requests";
import { BLOG_MESSAGE } from "../constants/messages";
import HTTP_STATUS_CODE from "../constants/httpStatusCode";

export const createBlogController = async (
  req: Request<ParamsDictionary, any, CreateBlogReqBody>,
  res: Response
) => {
  const { title, content, tags, status } = req.body;
  const { user_id } = req.decode_authorization as TokenPayLoad;

  const blogData = {
    title,
    content,
    authorId: user_id, // Lấy từ token
    tags,
    status,
  };

  const result = await blogService.createBlog(blogData);

  res.status(HTTP_STATUS_CODE.CREATED).json({
    message: BLOG_MESSAGE.BLOG_CREATED_SUCCESS,
    data: {
      blog_id: result.insertedId,
      ...blogData,
    },
  });
};

export const updateBlogController = async (
  req: Request<{ id: string }, any, UpdateBlogReqBody>,
  res: Response
) => {
  const { id } = req.params;
  const { title, content, tags, status } = req.body;

  // Blog đã được validate và load bởi middleware
  const blog = req.blog;

  if (!blog) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      message: BLOG_MESSAGE.BLOG_NOT_FOUND,
    });
  }

  const updateData: UpdateBlogReqBody = {};

  // Chỉ update các trường được provide
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (status !== undefined) updateData.status = status;
  if (tags !== undefined) updateData.tags = tags;

  const result = await blogService.updateBlog(id, updateData);

  if (result.matchedCount === 0) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      message: BLOG_MESSAGE.BLOG_NOT_FOUND,
    });
  }

  // Lấy blog đã update để trả về
  const updatedBlog = await blogService.getBlogById(id);

  res.status(HTTP_STATUS_CODE.OK).json({
    message: BLOG_MESSAGE.BLOG_UPDATED_SUCCESS,
    data: updatedBlog,
  });
};

export const getBlogController = async (req: Request<{ blog_id: string }>, res: Response) => {
  const { blog_id } = req.params;

  const blog = await blogService.getBlogById(blog_id);

  if (!blog) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      message: BLOG_MESSAGE.BLOG_NOT_FOUND,
    });
  }

  res.status(HTTP_STATUS_CODE.OK).json({
    message: BLOG_MESSAGE.GET_BLOG_SUCCESS,
    data: blog,
  });
};

export const getBlogsController = async (req: Request, res: Response) => {
  const { limit = 10, page = 1, author_id, status } = req.query;

  const result = await blogService.getBlogs(
    Number(limit),
    Number(page),
    author_id as string,
    status as string
  );

  res.status(HTTP_STATUS_CODE.OK).json({
    message: BLOG_MESSAGE.GET_BLOGS_SUCCESS,
    data: result.blogs,
    pagination: result.pagination,
  });
};

export const getMyBlogsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayLoad;
  const { limit = 10, page = 1, status } = req.query;

  const result = await blogService.getBlogs(
    Number(limit),
    Number(page),
    user_id, // Chỉ lấy blogs của user đang login
    status as string
  );

  res.status(HTTP_STATUS_CODE.OK).json({
    message: BLOG_MESSAGE.GET_BLOGS_SUCCESS,
    data: result.blogs,
    pagination: result.pagination,
  });
};

export const deleteBlogController = async (req: Request<{ blog_id: string }>, res: Response) => {
  const { blog_id } = req.params;

  // Blog đã được validate và load bởi middleware
  const blog = req.blog;

  if (!blog) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      message: BLOG_MESSAGE.BLOG_NOT_FOUND,
    });
  }

  const result = await blogService.deleteBlog(blog_id);

  if (result.matchedCount === 0) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      message: BLOG_MESSAGE.BLOG_NOT_FOUND,
    });
  }

  res.status(HTTP_STATUS_CODE.OK).json({
    message: BLOG_MESSAGE.BLOG_DELETED_SUCCESS,
  });
};
