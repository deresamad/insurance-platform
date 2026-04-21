import { AppError } from "../utils/appError.js";
import { userRepository } from "../repositories/userRepository.js";

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function choosePrimaryRole(roles = []) {
  const normalized = roles.map(normalizeRole).filter(Boolean);

  if (normalized.includes("ADMIN")) return "ADMIN";
  if (normalized.includes("UNDERWRITER")) return "UNDERWRITER";
  if (normalized.includes("AGENT")) return "AGENT";
  if (normalized.includes("CLAIMS_ADJUSTER")) return "CLAIMS_ADJUSTER";
  if (normalized.includes("CUSTOMER")) return "CUSTOMER";

  return normalized[0] || "CUSTOMER";
}

function splitName(identity) {
  if (identity.givenName || identity.familyName) {
    return {
      firstName: identity.givenName || "Keycloak",
      lastName: identity.familyName || "User"
    };
  }

  const fullName = String(identity.fullName || "").trim();

  if (!fullName) {
    return {
      firstName: identity.username || "Keycloak",
      lastName: "User"
    };
  }

  const parts = fullName.split(/\s+/);

  return {
    firstName: parts[0] || "Keycloak",
    lastName: parts.slice(1).join(" ") || "User"
  };
}

function buildDelegatedKeycloakUser(savedUser, identity, primaryRole) {
  const normalizedUser =
    typeof savedUser?.toObject === "function" ? savedUser.toObject() : savedUser;

  const profile = normalizedUser?.profile || {};

  return {
    _id: String(normalizedUser?._id || ""),
    keycloakSubject: identity.sub,
    username: normalizedUser?.username || identity.username || identity.sub,
    email: profile.email || identity.email || "",
    roles: normalizedUser?.roles || [],
    accountStatus: normalizedUser?.accountStatus || "ACTIVE",
    authSource: "KEYCLOAK",
    profile: {
      firstName: profile.firstName || identity.givenName || "",
      lastName: profile.lastName || identity.familyName || "",
      email: profile.email || identity.email || "",
      userType: profile.userType || primaryRole
    }
  };
}

export async function findOrProvisionUserFromKeycloak(identity) {
  if (!identity || !identity.sub) {
    throw new AppError("Invalid Keycloak identity payload", 401);
  }

  if (!identity.roles || identity.roles.length === 0) {
    throw new AppError("Keycloak user has no mapped application roles", 403);
  }

  const email = String(identity.email || "").trim().toLowerCase();
  const { firstName, lastName } = splitName(identity);
  const normalizedRoles = identity.roles.map(normalizeRole);
  const primaryRole = choosePrimaryRole(normalizedRoles);

  let user = null;

  if (email) {
    user = await userRepository.findByEmail(email);
  }

  if (!user && identity.username) {
    user = await userRepository.findByUsername(identity.username);
  }

  const roleEntities = await userRepository.findByNames(normalizedRoles);

  if (!roleEntities || roleEntities.length === 0) {
    throw new AppError("No matching roles found in database", 403);
  }

  let savedUser;

  if (!user) {
    savedUser = await userRepository.create({
      username: identity.username || email || identity.sub,
      passwordHash: "KEYCLOAK_EXTERNAL_USER",
      roles: roleEntities.map((r) => r._id),
      accountStatus: "ACTIVE",
      profile: {
        firstName,
        lastName,
        email,
        userType: primaryRole
      }
    });
  } else {
    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("Account is not active", 403);
    }

    savedUser = await userRepository.updateById(user._id, {
      username: identity.username || user.username,
      roles: roleEntities.map((r) => r._id),
      profile: {
        ...user.profile,
        firstName,
        lastName,
        email,
        userType: primaryRole
      },
      lastLoginAt: new Date()
    });
  }

  return buildDelegatedKeycloakUser(savedUser, identity, primaryRole);
}