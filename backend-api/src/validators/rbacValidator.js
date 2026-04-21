import { body } from "express-validator";

export const assignRolesValidator = [
  body("roles")
    .isArray({ min: 1 })
    .withMessage("roles must be a non-empty array of role names"),
  body("roles.*").isString().trim().notEmpty()
];