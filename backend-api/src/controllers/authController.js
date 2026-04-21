import jwt from "jsonwebtoken";
import { authService } from "../services/authService.js";
import { successResponse } from "../utils/apiResponse.js";
import { env } from "../config/env.js";
import { keycloakConfig } from "../config/keycloack.js";

const APP_TOKEN_COOKIE_NAME = "token";
const KEYCLOAK_STATE_COOKIE_NAME = "kc_state";

function getTokenFromRequest(req) {
  const authorizationHeader = req.headers.authorization || "";

  if (authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length).trim();
  }

  if (req.cookies?.token) {
    return String(req.cookies.token);
  }

  return "";
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  };
}

function buildKeycloakLogoutUrl() {
  const url = new URL(keycloakConfig.publicLogoutEndpoint);

  url.searchParams.set("client_id", keycloakConfig.clientId);
  url.searchParams.set(
    "post_logout_redirect_uri",
    keycloakConfig.frontendFailureRedirectUrl
  );

  return url.toString();
}

export const authController = {
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body.username, req.body.password);
      return successResponse(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  },

async logout(req, res, next) {
    try {
      const token = getTokenFromRequest(req);
      let authSource = "LOCAL";

      if (token) {
        try {
          const decoded = jwt.verify(token, env.jwtSecret);
          authSource = decoded?.authSource || "LOCAL";
        } catch {
          authSource = "LOCAL";
        }
      }

      res.clearCookie(APP_TOKEN_COOKIE_NAME, buildCookieOptions());
      res.clearCookie(KEYCLOAK_STATE_COOKIE_NAME, buildCookieOptions());

      if (authSource === "KEYCLOAK") {
        return res.redirect(buildKeycloakLogoutUrl());
      }

      return successResponse(
        res,
        { logout: true, authSource: "LOCAL" },
        "Logout successful"
      );
    } catch (error) {
      next(error);
    }
  },

  health(req, res) {
    return successResponse(res, { status: "UP" }, "Backend healthy");
  }
};