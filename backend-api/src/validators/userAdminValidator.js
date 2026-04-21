import { body } from "express-validator";
import { ACCOUNT_STATUS_VALUES } from "../constants/accountStatuses.js";

export const createUserValidator = [
  body("username").trim().notEmpty().isLength({ min: 2, max: 64 }),
  body("password").isString().isLength({ min: 8, max: 128 }),
  body("firstName").trim().notEmpty().isLength({ max: 80 }),
  body("lastName").trim().notEmpty().isLength({ max: 80 }),
  body("email").trim().notEmpty().isEmail(),
  body("phone").optional({ values: "null" }).isString().isLength({ max: 40 }),
  body("city").optional({ values: "null" }).isString().isLength({ max: 80 }),
  body("country").optional({ values: "null" }).isString().isLength({ max: 80 }),
  body("userType").trim().notEmpty().isString().isLength({ max: 40 }),
  body("roles").isArray({ min: 1 }),
  body("roles.*").isString().trim().notEmpty(),
  body("accountStatus")
    .optional()
    .isIn(ACCOUNT_STATUS_VALUES)
];

export const updateUserValidator = [
  body("firstName").optional().trim().notEmpty().isLength({ max: 80 }),
  body("lastName").optional().trim().notEmpty().isLength({ max: 80 }),
  body("email").optional().trim().isEmail(),
  body("phone").optional({ values: "null" }).isString().isLength({ max: 40 }),
  body("city").optional({ values: "null" }).isString().isLength({ max: 80 }),
  body("country").optional({ values: "null" }).isString().isLength({ max: 80 }),
  body("userType").optional().trim().notEmpty().isLength({ max: 40 }),
  body("accountStatus").optional().isIn(ACCOUNT_STATUS_VALUES)
];

export const updateUserStatusValidator = [
  body("accountStatus").notEmpty().isIn(ACCOUNT_STATUS_VALUES)
];
