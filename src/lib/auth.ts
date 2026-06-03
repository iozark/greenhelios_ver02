import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (!user.enabled) {
          throw new Error("Account is disabled");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role: string }).id = token.id as string;
        (session.user as { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
