import "dotenv/config";
import { MongoClient, Db, Collection } from "mongodb";
import { User } from "../models/schemas/Users.schemas";
import  RefreshToken from "../models/schemas/RefreshToken.schemas";
const uri = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`;
class DatabaseService {
  private db: Db;
  private client: MongoClient;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME);
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async indexUsers() {
    const isExistIndex = await this.users.indexExists([
      "email_1_username_1",
      "email_1",
      "username_1",
    ]);

    if (!isExistIndex) {
      this.users.createIndex({ email: 1, username: 1 });
      this.users.createIndex({ email: 1 }, { unique: true });
      this.users.createIndex({ username: 1 }, { unique: true });
    }
  }
   async indexRefreshTokens() {
    const isExistIndex = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
    if (!isExistIndex) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
  }
  
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string);
  }
  get blogs(): Collection {
    return this.db.collection(process.env.DB_BLOGS_COLLECTION as string);
  }
}
const databaseService = new DatabaseService();
export default databaseService;
