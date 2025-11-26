import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    strategy: "jwt", // Use JWT instead of database sessions
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to JWT token
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID to session object
      if (session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
})

