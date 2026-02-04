import express from "express";
import { envConfig } from "./config/env";
import matchesRouter from "./routes/matches";

const app = express();
const port = envConfig.PORT;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/matches", matchesRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
