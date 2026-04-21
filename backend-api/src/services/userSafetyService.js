import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/appError.js";

function roleNamesFromUser(user) {
  const roles = user?.roles || [];
  return roles.map((r) => (typeof r === "object" && r?.name ? r.name : String(r)));
}

export async function getAdminRoleId() {
  const role = await Role.findOne({ name: "ADMIN" });
  return role?._id || null;
}

export async function countActiveAdminsExcluding(excludeUserId) {
  const adminRoleId = await getAdminRoleId();
  if (!adminRoleId) {
    return 0;
  }

  const filter = {
    accountStatus: "ACTIVE",
    roles: adminRoleId
  };

  if (excludeUserId) {
    filter._id = { $ne: excludeUserId };
  }

  return User.countDocuments(filter);
}

/**
 * Ensures we never suspend/demote the last active Administrator.
 */
export async function assertCanRemoveActiveAdminPrivileges(
  targetUserId,
  { nextAccountStatus, nextRoleNames }
) {
  const user = await User.findById(targetUserId).populate("roles");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const names = roleNamesFromUser(user);
  const wasActiveAdmin =
    user.accountStatus === "ACTIVE" && names.includes("ADMIN");

  if (!wasActiveAdmin) {
    return;
  }

  const willBeActiveAdmin =
    nextAccountStatus === "ACTIVE" && (nextRoleNames || []).includes("ADMIN");

  if (willBeActiveAdmin) {
    return;
  }

  const otherActiveAdmins = await countActiveAdminsExcluding(targetUserId);
  if (otherActiveAdmins < 1) {
    throw new AppError(
      "Cannot suspend or modify the last active Administrator account",
      400
    );
  }
}
