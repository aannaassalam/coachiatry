/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  googleAuth,
  login,
  LoginBody
} from "@/external-api/functions/auth.api";
import { fetchProfile } from "@/external-api/functions/user.api";
import { User } from "@/typescript/interface/user.interface";
import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const FRONTEND_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // change this to the frontend timeout you want
const FRONTEND_SESSION_MAX_AGE_MS = FRONTEND_SESSION_MAX_AGE_SECONDS * 1000;

const isFrontendExpired = (frontendExpiresAt?: number) =>
  typeof frontendExpiresAt === "number" && Date.now() >= frontendExpiresAt;

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await login(credentials as LoginBody);

          if (!res || !res.data) {
            throw new Error("Invalid email or password");
          }

          const user: User & { token: string } = {
            ...res.data.user,
            token: res.data.token
          };

          if (!user._id) {
            throw new Error("Invalid user data returned from server");
          }

          user.id = user._id; // normalize id

          return user;
        } catch (error: any) {
          // You can be specific here:
          if (error.response?.status === 401) {
            throw new Error("Invalid email or password");
          } else if (error.response?.status === 403) {
            throw new Error("Your account is not verified");
          } else if (error.response?.status === 500) {
            throw new Error("Server error. Please try again later");
          }

          // Default fallback
          throw new Error(error?.response.data?.message || "Login failed");
        }
      }
    })
  ],
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60
    // maxAge: 30
  },
  jwt: {
    // maxAge: 30
    maxAge: 7 * 24 * 60 * 60
  },
  pages: {
    signIn: "/auth/login"
  },
  callbacks: {
    async jwt({ token, account, trigger, user }) {
      if (isFrontendExpired(token.frontendExpiresAt)) {
        token.frontendExpired = true;
        delete token.user;
        delete token.token;
        return token;
      }

      if (account?.provider === "google") {
        const googleIdToken = account.id_token;
        if (!googleIdToken) {
          throw new Error("Google id_token missing from provider response");
        }

        try {
          const res = await googleAuth(googleIdToken);

          token.user = res.data.user;
          token.token = res.data.token; // Your app's JWT
          token.frontendExpiresAt = Date.now() + FRONTEND_SESSION_MAX_AGE_MS;
          token.frontendExpired = false;
        } catch (err) {
          console.error("Google auth backend failed:", err);
          throw new Error("Google authentication failed");
        }
      } else if (user?.token) {
        const { token: appToken, ...rest } = user as User & {
          token: string;
        };
        token.user = rest;
        token.token = appToken;
        token.frontendExpiresAt = Date.now() + FRONTEND_SESSION_MAX_AGE_MS;
        token.frontendExpired = false;
      } else if (trigger === "update") {
        if (!token.token) return token;
        const appUser = await fetchProfile(token.token);
        token.user = appUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.frontendExpired || !token.token) {
        session.user = undefined;
        session.token = undefined;
        session.frontendExpiresAt = token.frontendExpiresAt;
        return session;
      }
      session.token = token.token as string;
      session.user = token.user as User;
      session.frontendExpiresAt = token.frontendExpiresAt;
      return session;
    }
  }
};

export default NextAuth(authOptions);
