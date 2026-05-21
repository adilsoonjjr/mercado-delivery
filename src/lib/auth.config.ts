import type { NextAuthConfig } from "next-auth";

// Edge-safe config — NO prisma/pg imports here (middleware runs on Edge Runtime)
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.marketId = (user as { marketId?: string }).marketId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.marketId = token.marketId as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
