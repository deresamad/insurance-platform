import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

function resolveCertPath(filePath) {
  if (!filePath) {
    return "";
  }

  return path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
}

/**
 * TLS options for Node https.createServer.
 * Use either HTTPS_KEY_PATH + HTTPS_CERT_PATH (e.g. openssl / mkcert PEM files)
 * or HTTPS_PFX_PATH + HTTPS_PFX_PASSPHRASE (PKCS#12 bundle).
 */
export function getHttpsOptions() {
  const keyPath = resolveCertPath(env.httpsKeyPath);
  const certPath = resolveCertPath(env.httpsCertPath);

  if (keyPath && certPath) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
  }

  const pfxPath = resolveCertPath(env.httpsPfxPath);

  if (pfxPath && env.httpsPfxPassphrase) {
    return {
      pfx: fs.readFileSync(pfxPath),
      passphrase: env.httpsPfxPassphrase
    };
  }

  throw new Error(
    "TLS not configured: set HTTPS_KEY_PATH and HTTPS_CERT_PATH, or HTTPS_PFX_PATH and HTTPS_PFX_PASSPHRASE. From backend-api run: npm run gen-cert"
  );
}
