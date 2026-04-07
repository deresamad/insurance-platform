import { env } from "./env.js";

export const corsOptions = {
  origin(origin, callback) {
    // Same-origin browser requests include Origin. Next.js rewrites may omit it (server → API).
    if (!origin || origin === env.frontendUrl) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true
};