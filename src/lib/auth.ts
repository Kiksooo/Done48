import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email и пароль",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!emailRaw || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: emailRaw } });
        if (!user?.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role as Role,
          onboardingDone: user.onboardingDone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user && "role" in user && "onboardingDone" in user) {
        token.sub = user.id;
        token.role = user.role;
        token.onboardingDone = user.onboardingDone;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { onboardingDone?: boolean };
        if (typeof patch.onboardingDone === "boolean") {
          token.onboardingDone = patch.onboardingDone;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as Role;
        session.user.onboardingDone = Boolean(token.onboardingDone);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
