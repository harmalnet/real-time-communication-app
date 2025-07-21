/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import User, { IUser } from "../db/models/user.model";
import { BadRequest } from "../errors/httpErrors";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";

// Extract environment variables
const clientId = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const callbackUrl = process.env.GOOGLE_CALLBACK_URL!;

class GoogleService {
  // Serialize user
  public initializePassport() {
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });

    // Configure Passport with Google Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: clientId,
          clientSecret: clientSecret,
          callbackURL: callbackUrl,
          passReqToCallback: true,
        },
        async (
          req: any,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: any
        ) => {
          try {
            // Find or create the user in your database
            const user = {
              profile: profile,
            };
            // Include tokens in the user object
            return done(null, user);
          } catch (error) {
            console.error("Error in Google Authentication:", error);
            return done(error, null);
          }
        }
      )
    );
  }

  async userGoogleSignup(data: any, userCustomId: string): Promise<IUser> {
    try {
      const user = new User({
        fullName: data.given_name || data.family_name +" "+ data.family_name || data.given_name,
        email: data.email,
        authMethod: "Google",
        accountType: "User",
        userCustomId,
        isVerified: true,
        authType: {
          googleUuid: data.sub,
        },
        profilePicture:
          data.picture ||
          "https://res.cloudinary.com/duzrrmfci/image/upload/v1703842924/logo.jpg",
        address: data.address || "",
        phoneNumber: data.phone_number || "",
      });


      await user.save();
      return user;
    } catch (error: any) {
      console.log(error);
      throw new BadRequest(error.message, "INVALID_REQUEST_PARAMETERS");
    }
  }
}

export default new GoogleService();
