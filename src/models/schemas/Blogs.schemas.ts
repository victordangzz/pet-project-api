import { ObjectId } from "mongodb";
import { BlogStatus } from "../../constants/enums";

interface BlogsType {
  _id?: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId;
  status?: BlogStatus;
  tags?: string[];
  viewCount?: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export class Blogs {
  _id?: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId;
  status: BlogStatus;
  tags: string[];
  viewCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(blog: BlogsType) {
    const date = new Date();
    this._id = blog._id;
    this.title = blog.title.trim();
    this.content = blog.content.trim();
    this.authorId = blog.authorId;
    this.status = blog.status || BlogStatus.Draft;
    this.tags = blog.tags || [];
    this.viewCount = blog.viewCount || 0;
    this.isDeleted = blog.isDeleted || false;
    this.createdAt = blog.createdAt || date;
    this.updatedAt = blog.updatedAt || date;
  }

  // Validation methods
  static validateTitle(title: string): boolean {
    return Boolean(title && title.trim().length >= 3 && title.trim().length <= 200);
  }

  static validateContent(content: string): boolean {
    return Boolean(content && content.trim().length >= 10);
  }

  static validateAuthorId(authorId: ObjectId): boolean {
    return ObjectId.isValid(authorId);
  }

  // Helper methods
  publish(): void {
    this.status = BlogStatus.Published;
    this.updatedAt = new Date();
  }

  archive(): void {
    this.status = BlogStatus.Archived;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.isDeleted = true;
    this.updatedAt = new Date();
  }

  incrementViewCount(): void {
    this.viewCount += 1;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (tag && !this.tags.includes(tag.toLowerCase())) {
      this.tags.push(tag.toLowerCase());
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag.toLowerCase());
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Convert to plain object for database operations
  toDocument(): BlogsType {
    return {
      _id: this._id,
      title: this.title,
      content: this.content,
      authorId: this.authorId,
      status: this.status,
      tags: this.tags,
      viewCount: this.viewCount,
      isDeleted: this.isDeleted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
