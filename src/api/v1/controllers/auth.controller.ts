/* eslint-disable no-inner-declarations */
/* eslint-disable prefer-const */
import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import pick from "lodash/pick";
import * as moment from "moment-timezone";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import {
  BadRequest,
  ResourceNotFound,
  Conflict,
  Unauthorized,
  Forbidden,
} from "../../../errors/httpErrors";
import Admin from "../../../db/models/admin.model";
import User, { IUser } from "../../../db/models/user.model";
import * as validators from "../validators/auth.validator";
import googleHelpers from "../../../utils/authGoogleHelpers";
import GeneratorService from "../../../utils/customIdGeneratorHelpers";

import {
  generateAuthToken,
  verifyRefreshToken,
} from "../../../utils/authHelpers";
import { userFields, adminFields } from "../../../utils/fieldHelpers";
import {
  verifyEmailNotification,
  welcomeNotification,
  resetPasswordEmail,
  successChangedPasswordEmail,
} from "../../../services/email.service";

const EMAIL_TOKEN_EXPIRY = 10; // 10 minutes
const PASSWORD_TOKEN_EXPIRY = 10; // 10 minutes

class AuthController {
  //user auth
  async userFormRegister(req: Request, res: Response) {
    const { error, data } = validators.createUserValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { fullName, email, password } = data;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      console.log(`${email} already exist, change the email.`);
      throw new Conflict(
        `${email} already exist, change the email.`,
        "EXISTING_USER_EMAIL"
      );
    }
    const accountType = "User";
    const hash = await bcrypt.hash(password, 10);

    // Generate custom user ID
    const userCustomId = await GeneratorService.generateUserCustomId();

    const userTimezone = moment.tz.guess();
    const now = moment.tz(userTimezone);
    const expiry = now.add(EMAIL_TOKEN_EXPIRY, "minutes").toDate();
    function generateOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
    const otp = generateOTP();

    const user = await User.create({
      fullName,
      email,
      userCustomId,
      accountType,
      authMethod: "Form",
      authType: {
        password: hash,
      },
      isVerified: false,
      emailConfirmation: {
        emailConfirmationToken: otp,
        emailConfirmationTokenExpiresAt: expiry,
      },
    });

    await verifyEmailNotification(user.email, user.fullName, otp);

    const formattedUser = pick(user, userFields);

    return res.created({
      user: formattedUser,
      message: "Email verification token sent to the email address provided",
    });
  }

  async userFormLogin(req: Request, res: Response) {
    const { error, data } = validators.loginValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { email, password } = data;

    // Check if a user with the provided email exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequest(
        "Invalid Login credentials.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }
    // Check if user account has been deleted
    if (user.deletedAt) {
      throw new Forbidden(
        "Your account is currently deleted. Contact support if this is by mistake.",
        "ACCESS_DENIED"
      );
    }
    if (user.accountType !== "User") {
      throw new Forbidden(
        "Your account is not a user. Contact support if this is by mistake.",
        "ACCESS_DENIED"
      );
    }

    // Check if user has "value" on password as authType
    if (user.authMethod !== "Form") {
      throw new Forbidden(
        "You have no password set; please sign in with a third-party provider, e.g. Google.",
        "ACCESS_DENIED"
      );
    }

    // Retrieve the hashed password from the user's business account
    const hashedPassword = user.authType?.password;

    // Check if hashedPassword is not undefined before using bcrypt.compareSync
    if (hashedPassword !== undefined) {
      const isPasswordValid = bcrypt.compareSync(password, hashedPassword);
      if (!isPasswordValid) {
        throw new Unauthorized(
          "Invalid Login credentials.",
          "INVALID_PASSWORD"
        );
      }
    } else {
      throw new Forbidden(
        "You have no password set; please sign in with a third-party provider, e.g. Google.",
        "ACCESS_DENIED"
      );
    }
    if (!user.isVerified) {
      console.log("Your account is not verified.");
      throw new BadRequest(
        "Your account is not verified. Kindly request for Email verification link",
        "EMAIL_NOT_VERIFIED"
      );
    }

    const { accessToken, refreshToken } = await generateAuthToken(user, "User");
    const formattedUser = pick(user, userFields);

    return res.ok({
      user: formattedUser,
      accessToken,
      refreshToken,
      message: "You are Logged in successfully",
    });
  }

  async formVerifyUniqueString(req: Request, res: Response) {
    const { otp } = req.query;

    if (!otp) {
      throw new BadRequest("otp token missing", "MISSING_REQUIRED_FIELD");
    }

    const user = await User.findOne({
      "emailConfirmation.emailConfirmationToken": otp,
    });

    if (!user) {
      throw new ResourceNotFound("Invalid Token", "RESOURCE_NOT_FOUND");
    }

    const userTimezone = moment.tz.guess();
    const now = moment.tz(userTimezone);
    const tokenExpired = now.isAfter(
      user.emailConfirmation?.emailConfirmationTokenExpiresAt
    );

    if (tokenExpired) {
      await User.findByIdAndUpdate(user._id, {
        isVerified: false,
        "emailConfirmation.emailConfirmationToken": null,
        "emailConfirmation.emailConfirmationTokenExpiresAt": null,
      });

      return res.error(
        400,
        "Token Expired, Request for a new link",
        "EXPIRED_TOKEN"
      );
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          isVerified: true,
          "emailConfirmation.emailConfirmationToken": null,
          "emailConfirmation.emailConfirmationTokenExpiresAt": null,
        },
        { new: true }
      );

      const { accessToken, refreshToken } = await generateAuthToken(
        user,
        user.accountType
      );

      await welcomeNotification(user.email, user.fullName, user._id);
      const formattedUser = pick(updatedUser, userFields);

      return res.ok({
        updatedUser: formattedUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
        message: "Email Address Verified Successfully",
      });
    }
  }

  async formEmailVerification(req: Request, res: Response) {
    let email = req.query.email as string;
    email = email.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      throw new ResourceNotFound(
        "Your associated account with the email not found",
        "RESOURCE_NOT_FOUND"
      );
    }
    if (user.isVerified) {
      console.log("Your account is already verified.");
      throw new BadRequest(
        "Your account is already verified!. Kindly use the Login link",
        "EMAIL_ALREADY_VERIFIED"
      );
    }

    const userTimezone = moment.tz.guess();
    const now = moment.tz(userTimezone);
    const expiry = now.add(EMAIL_TOKEN_EXPIRY, "minutes").toDate();
    function generateOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
    const otp = generateOTP();

    await User.findByIdAndUpdate(
      user._id,
      {
        "emailConfirmation.emailConfirmationToken": otp,
        "emailConfirmation.emailConfirmationTokenExpiresAt": expiry,
      },
      { new: true }
    );

    await verifyEmailNotification(user.email, user.fullName, otp);

    return res.ok({
      message: "Email verification token sent to the email address provided",
    });

    // let email = req.query.email as string;
    // email = email.toLowerCase();

    // await testEmail(email);

    // return res.ok({
    //   message: "Test email sent",
    // });
  }

  // GOOGLE FOR BOTH user
  async googleVerification(req: Request, res: Response) {
    const { error, data } = validators.oauthValidator(req.user);
    if (error) throw new BadRequest(error.message, error.code);

    const { email } = data.profile;

    let account: IUser | null = null;
    let authProcessType: string | null = null;

    //check if account exist
    account = (await User.findOne({ email: email })) || null;

    if (account?.isSuspended) {
      throw new Forbidden(
        "Your account is currently Suspended. Contact support if this is by mistake.",
        "ACCESS_DENIED"
      );
    }

    if (account && account?.authMethod !== "Google") {
      throw new Forbidden(
        "You have no password set; please sign in with a third-party provider, e.g., Google.",
        "ACCESS_DENIED"
      );
    }

    //create new account if it doesn't exist but sign if it exist
    if (!account) {
      const userCustomId = await GeneratorService.generateUserCustomId();

      account = await googleHelpers.userGoogleSignup(
        data.profile,
        userCustomId
      );

      await welcomeNotification(
        account!.email,
        account!.fullName,
        account!._id
      );

      authProcessType = "signup";
    } else {
      authProcessType = "signin";
    }

    const { accessToken, refreshToken } = await generateAuthToken(
      account,
      account.accountType
    );

    let formattedAccount: Partial<IUser> | null = null;
    formattedAccount = pick(account as IUser, userFields);

    res.ok({
      authProcessType,
      account: formattedAccount,
      token: accessToken,
      refreshToken: refreshToken,
      message: "You are logged in successfully",
    });
  }

  // admin auth
  async adminRegister(req: Request, res: Response) {
    const { error, data } = validators.createAdminValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { firstname, lastname, email, password, adminType } = data;

    const emailExists = await Admin.findOne({ email });
    if (emailExists) {
      console.log(`${email} already exist, change the email.`);
      throw new Conflict(
        `${email} already exist, change the email.`,
        "EXISTING_USER_EMAIL"
      );
    }
    const accountType = "Admin";
    const hash = await bcrypt.hash(password, 10);
    const adminCustomId = await GeneratorService.generateAdminCustomId();
    console.log(adminCustomId);

    const admin = await Admin.create({
      firstname,
      lastname,
      email,
      password: hash,
      isAdmin: true,
      accountType: "Admin",
      adminType,
      adminCustomId,
    });

    const { accessToken, refreshToken } = await generateAuthToken(
      admin,
      accountType
    );

    const formattedAdmin = pick(admin, adminFields);

    return res.created({
      admin: formattedAdmin,
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "Account created successfully",
    });
  }

  async adminLogin(req: Request, res: Response) {
    const { error, data } = validators.adminValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { email, password } = data;

    // Check if a admin with the provided email exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new BadRequest(
        "Admin account not found.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }
    // Check if user account has been deleted
    if (admin.deletedAt) {
      throw new Forbidden(
        "Your account is currently deleted. Contact support if this is by mistake.",
        "ACCESS_DENIED"
      );
    }
    if (admin.accountType !== "Admin") {
      throw new Forbidden(
        "Your account is not a admin. Contact support if this is by mistake.",
        "ACCESS_DENIED"
      );
    }

    // Verify the provided password against the hashed password
    const isPasswordValid = await bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      throw new Unauthorized("Invalid Login credentials.", "INVALID_PASSWORD");
    }

    const { accessToken, refreshToken } = await generateAuthToken(
      admin,
      "Admin"
    );
    const formattedAdmin = pick(admin, adminFields);

    return res.ok({
      admin: formattedAdmin,
      accessToken,
      refreshToken,
      message: "You are Logged in successfully",
    });
  }

  // General Reset Password
  async sendTokenToForgetPassword(req: Request, res: Response) {
    const { error, data } = validators.resetTokenValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    let { email } = data;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ResourceNotFound(
        "Your associated account with the email not found",
        "RESOURCE_NOT_FOUND"
      );
    }

    if (user.authType.password === undefined || user.authMethod !== "Form") {
      throw new BadRequest(
        "Cannot reset password for non-Form login account, continue with another option like Google",
        "INVALID_REQUEST_PARAMETERS"
      );
    }

    const userTimezone = moment.tz.guess();
    const now = moment.tz(userTimezone);
    const expiry = now.add(PASSWORD_TOKEN_EXPIRY, "minutes").toDate();

    function generateOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    user.passwordRecovery = {
      passwordRecoveryOtp: generateOTP(),
      passwordRecoveryOtpExpiresAt: expiry,
    };
    await user.save();

    const otp = user.passwordRecovery.passwordRecoveryOtp;

    if (otp && user.fullName && email) {
      await resetPasswordEmail(user.email, user.fullName, otp);
    }

    res.ok({ message: `New reset password Otp sent to ${email}` });
  }

  async verifyUserOtpResetPassword(req: Request, res: Response) {
    const { otp } = req.query;

    // Cast the req.query object to the expected payload structure
    const verifyTokenPayload = {
      otp: otp as string,
    };

    const { error } = validators.verifyTokenValidator(verifyTokenPayload);
    if (error) throw new BadRequest(error.message, error.code);

    const user = await User.findOne({
      "passwordRecovery.passwordRecoveryOtp": otp,
    });
    if (!user) {
      throw new Unauthorized("Invalid OTP supplied", "EXPIRED_TOKEN");
    }

    const userTimezone = moment.tz.guess();
    const now = moment.tz(userTimezone);
    const otpExpired = now.isAfter(
      user?.passwordRecovery?.passwordRecoveryOtpExpiresAt
    );

    // Handle expired OTP
    if (otpExpired) {
      user.passwordRecovery = {
        passwordRecoveryOtp: undefined,
        passwordRecoveryOtpExpiresAt: undefined,
      };
      await user.save();
      return res.error(400, "OTP Expired, request a new one", "EXPIRED_TOKEN");
    }

    res.ok({ message: "Otp validated successfully" });
  }

  async verifyUserOtpAndChangePassword(req: Request, res: Response) {
    const { error, data } = validators.verifyUserOtpAndChangePasswordValidator(
      req.body
    );
    if (error) throw new BadRequest(error.message, error.code);
    const { otp, newPassword } = data;

    const user = await User.findOne({
      "passwordRecovery.passwordRecoveryOtp": otp,
    });

    if (!user)
      throw new BadRequest("Invalid OTP", "INVALID_REQUEST_PARAMETERS");

    const userTimezone = moment.tz.guess();
    const now = moment.tz(userTimezone);
    const otpExpired = now.isAfter(
      user?.passwordRecovery?.passwordRecoveryOtpExpiresAt
    );

    // Handle expired OTP
    if (otpExpired) {
      user.passwordRecovery = {
        passwordRecoveryOtp: undefined,
        passwordRecoveryOtpExpiresAt: undefined,
      };
      await user.save();
      return res.error(400, "OTP Expired, request a new one", "EXPIRED_TOKEN");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.authType.password = hashedPassword;
      user.passwordRecovery = {
        passwordRecoveryOtp: undefined,
        passwordRecoveryOtpExpiresAt: undefined,
      };
      await user.save();
      await successChangedPasswordEmail(user.email, user.fullName);

      res.ok({ message: "Your Password has been changed successfully" });
    }
  }

  async resetadminPassword(req: Request, res: Response) {
    const { error, data } = validators.resetTokenValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    let { email } = data;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new ResourceNotFound(
        "Admin associated account with the email not found",
        "RESOURCE_NOT_FOUND"
      );
    }
    const randomBytes = uuidv4().split("-")[0];
    const password = `Admin@${randomBytes}`;
    const hash = await bcrypt.hash(password, 10);

    const updatedAdmin = await Admin.findByIdAndUpdate(admin._id, {
      password: hash,
      updatedAt: new Date(),
    });

    const formattedAdmin = pick(updatedAdmin, adminFields);

    res.ok({
      admin: formattedAdmin,
      newPassword: password,
      message: "Admin password updated successfully",
    });
  }

  //General Refresh Token and Logout for users and Admin
  async refreshToken(req: Request, res: Response) {
    const { error, data } = validators.tokenValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    //my birthday bug fixed
    const { refreshToken, accountType } = data;
    let payload, accessToken;
    // Define types for token details and verify result
    interface TokenDetails {
      userId?: string;
      adminId?: string;
      iat: number;
      exp: number;
    }

    // Specify the type of the returned value from verifyRefreshToken
    const result = await verifyRefreshToken(refreshToken, accountType);

    if (accountType === "User") {
      const tokenDetails = result.tokenDetails as TokenDetails; // Type assertion

      payload = { userId: tokenDetails.userId };
      accessToken = jwt.sign(payload, process.env.JWT_SEC, {
        expiresIn: "24h",
      });
    } else if (accountType === "Admin") {
      const tokenDetails = result.tokenDetails as TokenDetails; // Type assertion

      payload = { adminId: tokenDetails.adminId };
      accessToken = jwt.sign(payload, process.env.JWT_SEC, {
        expiresIn: "1h",
      });
    } else {
      throw new Unauthorized(
        "Account type is not valid for refreshing token",
        "INVALID_TOKEN"
      );
    }
    res.ok({
      accessToken,
      message: `New Access token created successfully for the ${accountType}`,
    });
  }

  async logout(req: Request, res: Response) {
    const { error, data } = validators.tokenValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    const { refreshToken, accountType } = data;

    if (accountType === "User") {
      const loggedUser = await User.findOneAndUpdate(
        { refreshToken: refreshToken },
        { refreshToken: "" },
        { new: true }
      );

      if (!loggedUser) {
        throw new Unauthorized("You are not logged in", "INVALID_TOKEN");
      }

      res.ok({ message: "Logged Out Successfully" });
    } else if (accountType === "Admin") {
      const loggedAdmin = await Admin.findOneAndUpdate(
        { refreshToken: refreshToken },
        { refreshToken: "" },
        { new: true }
      );

      if (!loggedAdmin) {
        throw new Unauthorized("You are not logged in", "INVALID_TOKEN");
      }

      res.ok({ message: "Logged Out Successfully" });
    } else {
      throw new Error("Invalid account type provided");
    }
  }

  async loggedInAccount(req: Request, res: Response) {
    const loggedInAccount = req.loggedInAccount;
    let formattedAccount;
    if (loggedInAccount.accountType === "User") {
      formattedAccount = pick(loggedInAccount, userFields);
    } else {
      formattedAccount = pick(loggedInAccount, adminFields);
    }

    res.ok({
      loggedInAccount: formattedAccount,
      message: "Current Logged-in Credential retrieved",
    });
  }
}

export default new AuthController();
