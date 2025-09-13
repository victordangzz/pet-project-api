import { ObjectId } from "mongodb";
import { BlogStatus } from "../../constants/enums";

export interface CreateBlogReqBody {
  title: string;
  content: string;
  authorId: ObjectId | string;
  tags?: string[];
  status?: BlogStatus;
}

export interface UpdateBlogReqBody {
  title?: string;
  content?: string;
  status?: BlogStatus;
  tags?: string[];
}
