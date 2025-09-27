import { login, LoginBody } from "@/api/functions/auth.api";
import { fetchProfile } from "@/api/functions/user.api";
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
          console.log("login response", res);
          if (!res.data) return null;

          // must return a plain object
          const user: User & { token: string } = {
            ...res.data.user,
            token: res.data.token
          };

          // MUST have id at minimum
          if (!user._id) return null;
          user.id = user._id; // normalize if API only provides _id

          return user;
        } catch (err) {
          console.log(err);
          return null;
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
