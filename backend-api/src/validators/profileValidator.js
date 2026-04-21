import { body } from "express-validator";

export const updateOwnProfileValidator = [
  body("firstName").optional().trim().notEmpty().isLength({ max: 80 }),
  body("lastName").optional().trim().notEmpty().isLength({ max: 80 }),
  body("email").optional().trim().isEmail(),
  body("phone").optional({ values: "null" }).isString().isLength({ max: 40 }),
  body("city").optional({ values: "null" }).isString().isLength({ max: 80 }),
  body("country").optional({ values: "null" }).isString().isLength({ max: 80 })
];