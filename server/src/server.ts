import express from "express";
import { envConfig, validateEnv } from "./config/env";
import matchesRouter from "./routes/matches";
import http from "http";
import { attachWebSockerServer } from "./ws/server";
validateEnv();

const PORT = envConfig.PORT;
const HOST = envConfig.HOST || "localhost";

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/matches", matchesRouter);

const { broadcastMatchCreated } = attachWebSockerServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(
    `WebSocket Server is running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});
