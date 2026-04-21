import { roleRepository } from "../repositories/roleRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/appError.js";
import { stripSensitiveUserFields } from "../utils/safeObject.js";
import { assertCanRemoveActiveAdminPrivileges } from "./userSafetyService.js";

function normalizeRoleNames(roles = []) {
  return roles
    .map((r) => String(r || "").trim().toUpperCase())
    .filter(Boolean);
}

export const rbacService = {
  async listRoles() {
    return roleRepository.findAll();
  },

  async assignRoles(userId, roles) {
    const normalized = normalizeRoleNames(roles);

    const validRoles = await roleRepository.findByNames(normalized);

    if (validRoles.length !== normalized.length) {
      throw new AppError("One or more roles are invalid", 400);
    }

    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    await assertCanRemoveActiveAdminPrivileges(userId, {
      nextAccountStatus: existing.accountStatus,
      nextRoleNames: normalized
    });

    const user = await userRepository.updateById(userId, {
      roles: validRoles.map((r) => r._id)
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return stripSensitiveUserFields(user);
  }
};