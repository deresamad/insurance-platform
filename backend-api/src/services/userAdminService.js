import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { userRepository } from "../repositories/userRepository.js";
import { roleRepository } from "../repositories/roleRepository.js";
import { AppError } from "../utils/appError.js";
import { stripSensitiveUserFields } from "../utils/safeObject.js";
import { ACCOUNT_STATUS_VALUES } from "../constants/accountStatuses.js";
import { assertCanRemoveActiveAdminPrivileges } from "./userSafetyService.js";

function normalizeRoleNames(roles = []) {
  return roles.map((r) => String(r || "").trim().toUpperCase()).filter(Boolean);
}

export const userAdminService = {
  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return stripSensitiveUserFields(user);
  },

  async listUsers() {
    const users = await userRepository.findAll();
    return users.map(stripSensitiveUserFields);
  },

  async listCustomers() {
    const users = await userRepository.findCustomers();
    return users.map(stripSensitiveUserFields);
  },

  async createUser(payload) {
    const username = String(payload.username || "").trim();
    const existing = await userRepository.findByUsername(username);
    if (existing) {
      throw new AppError("Username already exists", 409);
    }

    const roleNames = normalizeRoleNames(payload.roles);
    const roleEntities = await roleRepository.findByNames(roleNames);
    if (!roleEntities.length || roleEntities.length !== roleNames.length) {
      throw new AppError("One or more roles are invalid", 400);
    }

    const accountStatus = String(payload.accountStatus || "ACTIVE").toUpperCase();
    if (!ACCOUNT_STATUS_VALUES.includes(accountStatus)) {
      throw new AppError("Invalid account status", 400);
    }

    const password = String(payload.password || "");
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const profile = {
      firstName: String(payload.firstName || "").trim(),
      lastName: String(payload.lastName || "").trim(),
      email: String(payload.email || "").trim().toLowerCase(),
      phone: String(payload.phone || "").trim(),
      city: String(payload.city || "").trim(),
      country: String(payload.country || "").trim(),
      userType: String(payload.userType || roleNames[0] || "CUSTOMER").trim().toUpperCase()
    };

    if (!profile.firstName || !profile.lastName || !profile.email) {
      throw new AppError("First name, last name, and email are required", 400);
    }

    const created = await userRepository.create({
      username,
      passwordHash,
      roles: roleEntities.map((r) => r._id),
      accountStatus,
      profile
    });

    const populated = await User.findById(created._id).populate("roles");
    return stripSensitiveUserFields(populated);
  },

  async updateUser(userId, payload) {
    const dbUser = await userRepository.findById(userId);
    if (!dbUser) {
      throw new AppError("User not found", 404);
    }

    const currentRoles = (dbUser.roles || []).map((r) =>
      typeof r === "object" && r?.name ? r.name : String(r)
    );

    const nextStatus = payload.accountStatus
      ? String(payload.accountStatus).toUpperCase()
      : dbUser.accountStatus;

    if (payload.accountStatus && !ACCOUNT_STATUS_VALUES.includes(nextStatus)) {
      throw new AppError("Invalid account status", 400);
    }

    await assertCanRemoveActiveAdminPrivileges(userId, {
      nextAccountStatus: nextStatus,
      nextRoleNames: currentRoles.map((n) => String(n).toUpperCase())
    });

    const profileUpdates = {};
    const profileFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "country",
      "userType"
    ];

    for (const field of profileFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        profileUpdates[`profile.${field}`] = payload[field];
      }
    }

    const update = {
      ...profileUpdates,
      ...(payload.accountStatus ? { accountStatus: nextStatus } : {})
    };

    const updated = await userRepository.updateById(userId, update);
    return stripSensitiveUserFields(updated);
  },

  async updateUserStatus(userId, accountStatus) {
    const next = String(accountStatus || "").toUpperCase();
    if (!ACCOUNT_STATUS_VALUES.includes(next)) {
      throw new AppError("Invalid account status", 400);
    }

    const dbUser = await userRepository.findById(userId);
    if (!dbUser) {
      throw new AppError("User not found", 404);
    }

    const currentRoles = (dbUser.roles || []).map((r) =>
      typeof r === "object" && r?.name ? r.name : String(r)
    );

    await assertCanRemoveActiveAdminPrivileges(userId, {
      nextAccountStatus: next,
      nextRoleNames: currentRoles.map((n) => String(n).toUpperCase())
    });

    const user = await userRepository.updateById(userId, { accountStatus: next });
    return stripSensitiveUserFields(user);
  }
};
