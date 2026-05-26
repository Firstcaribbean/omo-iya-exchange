import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  enable2FASchema,
  updateProfileSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), AuthController.register);
router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/verify-email", validate(verifyEmailSchema), AuthController.verifyEmail);
router.post("/refresh-token", AuthController.refreshToken);

// Gated routes
router.get("/me", authenticate, AuthController.getMe);
router.put("/me", authenticate, validate(updateProfileSchema), AuthController.updateMe);
router.post("/enable-2fa", authenticate, AuthController.initiate2FA);
router.post("/verify-2fa", authenticate, validate(enable2FASchema), AuthController.complete2FA);
router.post("/disable-2fa", authenticate, validate(enable2FASchema), AuthController.disable2FA);

export default router;
