import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "./auth-adapter";
import { prisma } from "@/app/lib/prisma";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    sub?: string;
    isSubscribed?: boolean;
    hasActiveTrial?: boolean;
    trialEndDate?: Date | null;
    picture?: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSubscribed: boolean;
      hasActiveTrial: boolean;
      trialEndDate?: Date | null;
    };
  }

  interface User {
    id: string;
    isSubscribed?: boolean;
    hasActiveTrial?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  // Temporarily disable adapter since we're using backend OAuth
  // Adapter is only needed if NextAuth creates users (which backend does now)
  // adapter: PrismaAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If already on the signin page and trying to redirect there again, go to home
      if (url.includes("/auth/signin") && url.includes("callbackUrl")) {
        return baseUrl;
      }

      // Standard redirect logic
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (url.startsWith("http")) {
        return url;
      }
      return baseUrl;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isSubscribed = !!token.isSubscribed;
        session.user.hasActiveTrial = !!token.hasActiveTrial;
        session.user.trialEndDate = token.trialEndDate || null;
        console.log(
          `[NextAuth] ✅ Session created for userId: ${token.id}, email: ${session.user.email || "N/A"}`
        );
      }
      return session;
    },

    async jwt({ token, user, trigger, session }) {
      // If user is provided (from signIn), use it
      if (user) {
        token.id = user.id;
        console.log(
          `[NextAuth] 🔐 JWT token created/updated for userId: ${user.id}`
        );

        // Try to fetch subscription info from database (optional - backend handles this)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              subscriptionStatus: true,
              hasActiveTrial: true,
              trialEndDate: true,
            },
          });

          token.isSubscribed = dbUser?.subscriptionStatus === "ACTIVE";
          token.hasActiveTrial = dbUser?.hasActiveTrial || false;
          token.trialEndDate = dbUser?.trialEndDate || null;
        } catch (error) {
          // Database not accessible - that's okay, backend handles auth
          console.log(`[NextAuth] Database not accessible, using defaults`);
          token.isSubscribed = false;
          token.hasActiveTrial = false;
          token.trialEndDate = null;
        }
      }
      
      // If no user but we have a token ID, check if we need to refresh from backend cookie
      // This handles the case where backend OAuth set auth-token cookie but NextAuth doesn't have a session
      if (!user && !token.id && trigger === "update") {
        // This will be called when session is updated
        // We'll handle backend cookie sync in a separate endpoint
      }
      
      return token;
    },
  },
};
