import { User } from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { stripSensitiveUserFields } from "../utils/safeObject.js";

function normalizeRoleName(role) {
  if (!role) return "";
  if (typeof role === "string") return role.trim().toUpperCase();
  if (typeof role === "object" && role.name) {
    return String(role.name).trim().toUpperCase();
  }
  return String(role).trim().toUpperCase();
}

function userHasAdminRole(user) {
  const direct = Array.isArray(user?.roles) ? user.roles : [];
  const fromRoles = direct.map(normalizeRoleName).filter(Boolean);
  const fromProfile = normalizeRoleName(user?.profile?.userType);
  const merged = new Set(fromRoles);
  if (fromProfile) merged.add(fromProfile);
  return merged.has("ADMIN");
}

async function loadBackedUser(userId) {
  if (!userId || String(userId).startsWith("kc:")) {
    return null;
  }
  return User.findById(userId).populate("roles");
}

export const profileService = {
  async getOwnProfile(user) {
    const dbUser = await loadBackedUser(user._id);
    if (dbUser) {
      return stripSensitiveUserFields(dbUser);
    }

    return {
      _id: user._id,
      username: user.username,
      roles: user.roles,
      accountStatus: user.accountStatus || "ACTIVE",
      profile: user.profile || {
        firstName: "",
        lastName: "",
        email: user.email || "",
        userType: ""
      }
    };
  },

  async updateOwnProfile(user, updates) {
    const dbUser = await loadBackedUser(user._id);
    if (!dbUser) {
      throw new AppError("User not found", 404);
    }

    const allowed = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "country"
    ];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        dbUser.profile[key] = updates[key];
      }
    }

    await dbUser.save();

    const refreshedUser = await User.findById(user._id).populate("roles");
    return stripSensitiveUserFields(refreshedUser);
  },

  async suspendOwnAccount(user) {
    if (userHasAdminRole(user)) {
      throw new AppError(
        "Administrators cannot deactivate their own account through self-service",
        403
      );
    }

    const dbUser = await loadBackedUser(user._id);
    if (!dbUser) {
      throw new AppError("User not found", 404);
    }

    dbUser.accountStatus = "SUSPENDED";
    await dbUser.save();

    const refreshedUser = await User.findById(user._id).populate("roles");
    return stripSensitiveUserFields(refreshedUser);
  }
};
