import https from "https";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { getHttpsOptions } from "./config/https.js";

async function startServer() {
  await connectDatabase();

  const tlsOptions = getHttpsOptions();
  const server = https.createServer(tlsOptions, app);

  server.listen(env.port, () => {
    console.log(`NorthStar API (HTTPS) listening on https://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
