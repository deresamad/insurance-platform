import { User } from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { stripSensitiveUserFields } from "../utils/safeObject.js";

const ALLOWED_OWN_PROFILE_KEYS = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "province",
  "postalCode",
  "country",
  "preferredContactMethod",
  "emergencyContactName",
  "emergencyContactPhone",
  "clientCategory",
  "lifeInsuranceBeneficiaryNote"
]);

function pickAllowedProfileUpdates(updates) {
  const payload = {};
  for (const key of ALLOWED_OWN_PROFILE_KEYS) {
    if (updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }
  return payload;
}

export const profileService = {
  async getOwnProfile(userId) {
    const user = await User.findById(userId).populate("roles");
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return stripSensitiveUserFields(user);
  },

  async updateOwnProfile(userId, updates) {
    const user = await User.findById(userId).populate("roles");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const safeUpdates = pickAllowedProfileUpdates(updates);
    Object.assign(user.profile, safeUpdates);
    await user.save();

    const refreshedUser = await User.findById(userId).populate("roles");
    return stripSensitiveUserFields(refreshedUser);
  }
};
