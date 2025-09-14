import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import { User as AppUser } from "@/typescript/interface/user.interface";

declare module "next-auth" {
  // authorize() must return this shape
  interface User extends AppUser {
    token: string;
  }

  interface Session {
    token?: string;
    user?: AppUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    token?: string;
    user?: AppUser;
  }
}
