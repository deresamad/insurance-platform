import { body } from "express-validator";

export const updateOwnProfileValidator = [
  body("firstName").optional().isString(),
  body("lastName").optional().isString(),
  body("email").optional().isEmail(),
  body("phone").optional().isString(),
  body("addressLine1").optional().isString(),
  body("addressLine2").optional().isString(),
  body("city").optional().isString(),
  body("province").optional().isString(),
  body("postalCode").optional().isString(),
  body("country").optional().isString(),
  body("preferredContactMethod").optional().isString(),
  body("emergencyContactName").optional().isString(),
  body("emergencyContactPhone").optional().isString(),
  body("clientCategory").optional().isString(),
  body("lifeInsuranceBeneficiaryNote").optional().isString()
];