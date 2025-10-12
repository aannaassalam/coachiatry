/* eslint-disable @typescript-eslint/no-explicit-any */

import { login, LoginBody } from "@/external-api/functions/auth.api";
import { fetchProfile } from "@/external-api/functions/user.api";
import { User } from "@/typescript/interface/user.interface";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
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
          throw new Error(error.message || "Login failed");
        }
      }
    })
  ],
  debug: true,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login"
  },
  callbacks: {
    async jwt({ token, trigger, user }) {
      if (user) {
        const { token: appToken, ...rest } = user as User & {
          token: string;
        };
        token.user = rest;
        token.token = appToken;
      } else if (trigger === "update") {
        const appUser = await fetchProfile(token.token);
        token.user = appUser;
      }
      return token;
    },
    async session({ session, token }) {
      session.token = token.token as string;
      session.user = token.user as User;
      return session;
    }
  }
});
