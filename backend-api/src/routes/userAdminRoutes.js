import { Router } from "express";
import { userAdminController } from "../controllers/userAdminController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createUserValidator,
  updateUserStatusValidator,
  updateUserValidator
} from "../validators/userAdminValidator.js";
import { handleValidation } from "../middleware/validationMiddleware.js";

const router = Router();

router.get("/", authenticate, authorizeRoles("ADMIN"), userAdminController.listUsers);
router.get(
  "/customers",
  authenticate,
  authorizeRoles("ADMIN", "AGENT"),
  userAdminController.listCustomers
);
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  createUserValidator,
  handleValidation,
  userAdminController.createUser
);
router.put(
  "/:userId/status",
  authenticate,
  authorizeRoles("ADMIN"),
  updateUserStatusValidator,
  handleValidation,
  userAdminController.updateUserStatus
);
router.get(
  "/:userId",
  authenticate,
  authorizeRoles("ADMIN"),
  userAdminController.getUser
);
router.put(
  "/:userId",
  authenticate,
  authorizeRoles("ADMIN"),
  updateUserValidator,
  handleValidation,
  userAdminController.updateUser
);

export default router;
