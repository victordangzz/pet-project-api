import databaseService from "./services/database.service";
import express from "express";
import { createServer } from "http";
import "dotenv/config";
import cors from "cors";
import usersRouter from "./routes/user.routes";
import { PATH } from "./constants/path";
import { defaultErrorHandle } from "./middlewares/error.middleware";
databaseService.connect().then(() => {
  databaseService.indexUsers();
});
const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: "http://localhost:5173", // cho phép frontend gọi
    credentials: true,
  })
);
app.use(express.json());
app.use(PATH.USER, usersRouter);

// Error handler middleware phải đặt cuối cùng
app.use(defaultErrorHandle);

httpServer.listen(process.env.APP_PORT, () => {
  console.log(`Server starting with: ${process.env.APP_URL}:${process.env.APP_PORT}`);
});
