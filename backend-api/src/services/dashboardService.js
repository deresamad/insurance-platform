import mongoose from "mongoose";
import { Policy } from "../models/Policy.js";
import { Claim } from "../models/Claim.js";
import { AmendmentRequest } from "../models/AmendmentRequest.js";
import { ReductionRequest } from "../models/ReductionRequest.js";

function normalizeRoleNames(user) {
  return (user?.roles || []).map((role) => {
    if (typeof role === "string") return role;
    if (role && typeof role === "object" && role.name) return role.name;
    return String(role);
  });
}

/** Only external customers see scoped counts; staff and admin see global workspace totals. */
function isCustomerOnly(user) {
  const names = normalizeRoleNames(user);
  return names.length === 1 && names[0] === "CUSTOMER";
}

export const dashboardService = {
  async getGlobalSummary() {
    const [policies, claims, amendments, reductions] = await Promise.all([
      Policy.countDocuments(),
      Claim.countDocuments(),
      AmendmentRequest.countDocuments(),
      ReductionRequest.countDocuments()
    ]);

    return {
      policies,
      claims,
      amendments,
      reductions
    };
  },

  async getSummaryForUser(user) {
    if (!user?._id) {
      return this.getGlobalSummary();
    }

    if (!isCustomerOnly(user)) {
      return this.getGlobalSummary();
    }

    const userId = new mongoose.Types.ObjectId(String(user._id));

    const [policies, claims, amendments, reductions] = await Promise.all([
      Policy.countDocuments({ customer: userId }),
      Claim.countDocuments({ claimedBy: userId }),
      AmendmentRequest.countDocuments({ requestedBy: userId }),
      ReductionRequest.countDocuments({ requestedBy: userId })
    ]);

    return {
      policies,
      claims,
      amendments,
      reductions
    };
  }
};
