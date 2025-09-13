import { Router } from "express";

import { PATH } from "../constants/path";
import {
  createBlogValidator,
  updateBlogValidator,
  updateBlogBodyValidator,
  getBlogValidator,
  deleteBlogValidator,
  checkBlogOwnership,
} from "../middlewares/blog.middleware";
import { wrapRequestHandler } from "../utils/handlers";
import {
  createBlogController,
  updateBlogController,
  getBlogController,
  getBlogsController,
  getMyBlogsController,
  deleteBlogController,
} from "../controllers/blog.controller";
import { accessTokenValidator, verifiedUserValidator } from "../middlewares/user.middleware";

const blogsRouter = Router();

/**
 * Description route: Create a new blog
 * Path: /blogs
 * Method: POST
 * Request body: { title: string, content: string, tags?: string[], status?: BlogStatus }
 * */
blogsRouter.post(
  "/",
  accessTokenValidator,
  verifiedUserValidator,
  createBlogValidator,
  wrapRequestHandler(createBlogController)
);

/**
 * Description route: Update an existing blog
 * Path: /blogs/update/:id
 * Method: PUT
 * Request body: { title?: string, content?: string, tags?: string[], status?: BlogStatus }
 * */

blogsRouter.put(
  "/update/:id",
  accessTokenValidator,
  verifiedUserValidator,
  updateBlogValidator, 
  checkBlogOwnership, 
  updateBlogBodyValidator, 
  wrapRequestHandler(updateBlogController)
);

/**
 * Description route: Get all blogs of the logged-in user
 * Path: /my-blogs
 * Method: GET
 * Request body: 
 * */
blogsRouter.get(
  "/my-blogs",
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getMyBlogsController)
);

/**
 * Description route: Get a single blog by ID
 * Path: /blogs/:blog_id
 * Method: GET
 * Request body: 
 * */
blogsRouter.get("/:blog_id", getBlogValidator, wrapRequestHandler(getBlogController));

/**
 * Description route: Get all blogs
 * Path: /blogs
 * Method: GET
 * Request body: 
 * */
blogsRouter.get("/", wrapRequestHandler(getBlogsController));

/**
 * Description route: Delete a blog
 * Path: /blogs/:blog_id
 * Method: DELETE
 * Request body: 
 * */
blogsRouter.delete(
  "/:blog_id",
  accessTokenValidator,
  verifiedUserValidator,
  deleteBlogValidator, 
  checkBlogOwnership, 
  wrapRequestHandler(deleteBlogController)
);

export default blogsRouter;
