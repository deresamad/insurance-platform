/**
 * End-to-end API smoke test: in-memory MongoDB, HTTPS server, seed, login, protected route.
 * Run: npm run test:api  (from backend-api)
 */
import { spawn } from "child_process";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function httpsRequest(method, port, pathname, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathname,
        method,
        rejectUnauthorized: false,
        headers: {
          ...(payload
            ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => {
          buf += c;
        });
        res.on("end", () => {
          let parsed = buf;
          try {
            parsed = buf ? JSON.parse(buf) : null;
          } catch {
            /* keep raw */
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function waitForHealth(port, timeoutMs = 45_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tick() {
      httpsRequest("GET", port, "/api/auth/health")
        .then(({ status, body }) => {
          if (status === 200 && body?.success) {
            resolve();
            return;
          }
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Health check timeout (last status ${status})`));
            return;
          }
          setTimeout(tick, 250);
        })
        .catch(() => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error("Health check timeout (connection failed)"));
            return;
          }
          setTimeout(tick, 250);
        });
    }
    tick();
  });
}

function runNodeScript(relativePath, baseEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [relativePath], {
      cwd: root,
      env: baseEnv,
      stdio: "inherit"
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`node ${relativePath} exited with ${code}`));
      }
    });
  });
}

const mem = await MongoMemoryServer.create();
const mongoUri = mem.getUri();
const smokePort = 50200 + Math.floor(Math.random() * 200);

const baseEnv = {
  ...process.env,
  MONGODB_URI: mongoUri,
  JWT_SECRET: "smoke_test_jwt_secret",
  JWT_EXPIRES_IN: "1h",
  FRONTEND_URL: "http://localhost:3000",
  HTTPS_KEY_PATH: "./cert/server.key",
  HTTPS_CERT_PATH: "./cert/server.crt",
  PORT: String(smokePort),
  NODE_ENV: "test"
};

let serverProc = null;
let serverLog = "";

try {
  console.log("→ Starting in-memory MongoDB");
  console.log("→ Seeding roles + users");
  await runNodeScript("src/seed/roles.seed.js", baseEnv);
  await runNodeScript("src/seed/users.seed.js", baseEnv);

  console.log(`→ Starting HTTPS API on port ${smokePort}`);
  serverProc = spawn("node", ["src/server.js"], {
    cwd: root,
    env: baseEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });
  serverProc.stdout?.on("data", (c) => {
    serverLog += c;
  });
  serverProc.stderr?.on("data", (c) => {
    serverLog += c;
  });

  await waitForHealth(smokePort);
  console.log("✓ GET /api/auth/health");

  const badLogin = await httpsRequest("POST", smokePort, "/api/auth/login", {
    body: { username: "customer1", password: "wrong" }
  });
  if (badLogin.status !== 401) {
    throw new Error(`Expected 401 invalid login, got ${badLogin.status}`);
  }
  console.log("✓ POST /api/auth/login rejects bad password (401)");

  const goodLogin = await httpsRequest("POST", smokePort, "/api/auth/login", {
    body: { username: "customer1", password: "Password123!" }
  });
  if (goodLogin.status !== 200 || !goodLogin.body?.data?.token) {
    throw new Error(`Login failed: ${JSON.stringify(goodLogin.body)}`);
  }
  const { token } = goodLogin.body.data;
  const decoded = jwt.verify(token, baseEnv.JWT_SECRET);
  if (!decoded.userId || !decoded.username || !Array.isArray(decoded.roles)) {
    throw new Error(`JWT missing claims: ${JSON.stringify(decoded)}`);
  }
  if (!decoded.roles.includes("CUSTOMER")) {
    throw new Error(`Expected CUSTOMER in token roles: ${decoded.roles}`);
  }
  console.log("✓ POST /api/auth/login returns JWT with userId, username, roles");

  const profile = await httpsRequest("GET", smokePort, "/api/profile/me", { token });
  if (profile.status !== 200 || profile.body?.data?.username !== "customer1") {
    throw new Error(`Profile me failed: ${JSON.stringify(profile.body)}`);
  }
  console.log("✓ GET /api/profile/me with Bearer token");

  const noAuth = await httpsRequest("GET", smokePort, "/api/profile/me");
  if (noAuth.status !== 401) {
    throw new Error(`Expected 401 without token, got ${noAuth.status}`);
  }
  console.log("✓ GET /api/profile/me without token → 401");

  console.log("\nAll smoke tests passed.");
} catch (e) {
  console.error("\nSmoke test failed:", e.message);
  if (serverProc && serverLog) {
    console.error("Server output:\n", serverLog.slice(-4000));
  }
  process.exitCode = 1;
} finally {
  if (serverProc && !serverProc.killed) {
    serverProc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
  }
  await mem.stop();
}
