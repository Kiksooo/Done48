import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      onboardingDone: boolean;
    };
  }

  interface User {
    role: Role;
    onboardingDone: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    onboardingDone?: boolean;
  }
}
