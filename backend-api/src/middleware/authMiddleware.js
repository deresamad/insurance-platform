import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { userRepository } from "../repositories/userRepository.js";
import { env } from "../config/env.js";
import { verifyKeycloakAccessToken } from "../services/keycloackService.js";

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

function normalizeRoles(roles) {
  return (roles || []).map((role) => {
    if (typeof role === "string") return role;
    if (role && typeof role === "object" && role.name) return role.name;
    return String(role);
  });
}

function buildDelegatedUserFromKeycloakIdentity(identity) {
  return {
    _id: `kc:${String(identity.sub || "")}`,
    keycloakSubject: String(identity.sub || ""),
    username: identity.username || "",
    email: identity.email || "",
    roles: normalizeRoles(identity.roles),
    accountStatus: "ACTIVE",
    authSource: "KEYCLOAK",
    profile: {
      firstName: identity.givenName || "",
      lastName: identity.familyName || "",
      email: identity.email || "",
      userType: ""
    }
  };
}

async function resolveLocalUser(decoded) {
  if (!decoded?.userId) return null;

  const userId = String(decoded.userId);

  // Skip Keycloak-linked users
  if (userId.startsWith("kc:")) return null;

  const user = await userRepository.findById(userId);
  if (!user) return null;

  if (user.accountStatus && user.accountStatus !== "ACTIVE") {
    return null;
  }

  const normalizedUser =
    typeof user.toObject === "function" ? user.toObject() : user;

  return {
    ...normalizedUser,
    _id: String(user._id),
    roles: normalizeRoles(user.roles),
    authSource: "LOCAL"
  };
}

function tryVerifyLocalJwt(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

async function tryVerifyKeycloakJwt(token) {
  try {
    return await verifyKeycloakAccessToken(token);
  } catch {
    return null;
  }
}

export async function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }

    //  Step 1: Try LOCAL JWT
    const localDecoded = tryVerifyLocalJwt(token);

    if (localDecoded) {
      // Case: local login OR exchanged Keycloak JWT (both carry Mongo userId)
      const localUser = await resolveLocalUser(localDecoded);

      if (!localUser) {
        return next(new AppError("Unauthorized", 401));
      }

      req.user =
        localDecoded.authSource === "KEYCLOAK"
          ? { ...localUser, authSource: "KEYCLOAK" }
          : localUser;
      return next();
    }

    // Step 2: Try Keycloak access token
    const keycloakIdentity = await tryVerifyKeycloakJwt(token);

    if (keycloakIdentity) {
      const email = String(keycloakIdentity.email || "").trim().toLowerCase();
      let linked = null;

      if (email) {
        linked = await userRepository.findByEmail(email);
      }

      if (!linked && keycloakIdentity.username) {
        linked = await userRepository.findByUsername(keycloakIdentity.username);
      }

      if (linked && linked.accountStatus !== "ACTIVE") {
        return next(new AppError("Unauthorized", 401));
      }

      req.user = buildDelegatedUserFromKeycloakIdentity(keycloakIdentity);
      return next();
    }

    // Step 3: Reject
    return next(new AppError("Unauthorized", 401));
  } catch (error) {
    return next(error);
  }
}