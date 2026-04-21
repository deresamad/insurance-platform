import { profileService } from "../services/profileService.js";
import { successResponse } from "../utils/apiResponse.js";

export const profileController = {
  async getOwnProfile(req, res, next) {
    try {
      const data = await profileService.getOwnProfile(req.user);
      return successResponse(res, data, "Profile loaded");
    } catch (error) {
      next(error);
    }
  },

  async updateOwnProfile(req, res, next) {
    try {
      const data = await profileService.updateOwnProfile(req.user, req.body);
      return successResponse(res, data, "Profile updated");
    } catch (error) {
      next(error);
    }
  },

  async suspendOwnAccount(req, res, next) {
    try {
      const data = await profileService.suspendOwnAccount(req.user);
      return successResponse(res, data, "Account suspended");
    } catch (error) {
      next(error);
    }
  }
};