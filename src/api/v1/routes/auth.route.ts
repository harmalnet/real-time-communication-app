import express from "express";

import controller from "../controllers/auth.controller";
import { auth } from "../../middlewares/authMiddleware";
import passport from "passport";

const authRouter = express.Router();

// form Auth buyer
authRouter.post("/user/register", controller.userFormRegister);
authRouter.post("/user/login", controller.userFormLogin);
authRouter.post("/user/verify-token", controller.formVerifyUniqueString);
authRouter.post("/user/resend-token", controller.formEmailVerification);

// Google Auth
authRouter.get(
  "/google/getauthurl",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/failed" }),
  controller.googleVerification
);

//password reset and regenerate verify email token for users/sellers
authRouter.post(
  "/forgotpassword/send-token",
  controller.sendTokenToForgetPassword
);
authRouter.post(
  "/forgotpassword/verify-token",
  controller.verifyUserOtpResetPassword
);
authRouter.post(
  "/forgotpassword/change-password",
  controller.verifyUserOtpAndChangePassword
);
authRouter.post(
  "/resetpassword/admin",
  auth({ accountType: ["admin"], adminType: ["Super-Admin"] }),
  controller.resetadminPassword
);

// Auth admin
authRouter.post("/admin/register", controller.adminRegister);
authRouter.post("/admin/login", controller.adminLogin);

//refresh and logout
authRouter.post("/refresh-token", controller.refreshToken);
authRouter.patch("/logout", controller.logout);

// get loggedin user/seller/admin
authRouter.get("/me", auth(), controller.loggedInAccount);

export default authRouter;
