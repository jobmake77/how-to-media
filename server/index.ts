import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createApp } from "./app";

const databasePath = process.env.DATABASE_PATH || "./data/how-to-media.sqlite";
const port = Number(process.env.PORT || 4317);
const databaseDirectory = path.dirname(databasePath);

if (databaseDirectory !== ".") {
  fs.mkdirSync(databaseDirectory, { recursive: true });
}

const { app } = createApp({
  databasePath,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini"
});

app.listen(port, "127.0.0.1", () => {
  console.log(`How To Media API listening on http://127.0.0.1:${port}`);
});
