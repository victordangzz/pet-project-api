import { Blogs } from "./../models/schemas/Blogs.schemas";
import databaseService from "./database.service";
import { ObjectId } from "mongodb";
import { CreateBlogReqBody, UpdateBlogReqBody } from "../models/dto/Blog.requests";

class BlogsService {
  async createBlog(payload: CreateBlogReqBody) {
    const blog = new Blogs({
      title: payload.title,
      content: payload.content,
      authorId: new ObjectId(payload.authorId),
      tags: payload.tags,
      status: payload.status,
    });
    const result = await databaseService.blogs.insertOne(blog);
    return result;
  }

  async updateBlog(blogId: string, payload: UpdateBlogReqBody) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Chỉ update các trường được provide
    if (payload.title !== undefined) {
      updateData.title = payload.title.trim();
    }
    if (payload.content !== undefined) {
      updateData.content = payload.content.trim();
    }
    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }
    if (payload.tags !== undefined) {
      updateData.tags = payload.tags.map((tag) => tag.toLowerCase());
    }

    const result = await databaseService.blogs.updateOne(
      {
        _id: new ObjectId(blogId),
        isDeleted: false,
      },
      {
        $set: updateData,
      }
    );

    return result;
  }

  async getBlogById(blogId: string) {
    const blog = await databaseService.blogs.findOne({
      _id: new ObjectId(blogId),
      isDeleted: false,
    });

    // Tăng view count khi get blog
    if (blog) {
      await databaseService.blogs.updateOne(
        { _id: new ObjectId(blogId) },
        {
          $inc: { viewCount: 1 },
          $set: { updatedAt: new Date() },
        }
      );
    }

    return blog;
  }

  async getBlogs(limit: number = 10, page: number = 1, authorId?: string, status?: string) {
    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false };

    // Filter by author if provided
    if (authorId && ObjectId.isValid(authorId)) {
      filter.authorId = new ObjectId(authorId);
    }

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    const [blogs, total] = await Promise.all([
      databaseService.blogs
        .find(filter)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .toArray(),
      databaseService.blogs.countDocuments(filter),
    ]);

    return {
      blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteBlog(blogId: string) {
    const result = await databaseService.blogs.updateOne(
      {
        _id: new ObjectId(blogId),
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      }
    );
    return result;
  }
}

const blogService = new BlogsService();
export default blogService;
