import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function roleNamesFromUser(user) {
  const raw = user.roles || [];
  return raw.map((r) => {
    if (typeof r === "string") {
      return r;
    }
    if (r && typeof r === "object" && r.name) {
      return r.name;
    }
    return String(r);
  });
}

export const tokenService = {
  /**
   * Signed JWT for API auth. Includes userId, username, roles; iat/exp from jwt.sign + expiresIn.
   * Passwords and other secrets are never embedded in the token.
   */
  generateAccessToken(user) {
    const roles = roleNamesFromUser(user);

    return jwt.sign(
      {
        userId: String(user._id),
        username: user.username,
        roles
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
  }
};
