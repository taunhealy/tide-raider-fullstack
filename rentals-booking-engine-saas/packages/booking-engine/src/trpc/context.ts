import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
// TODO: Uncomment when Supabase is set up and Prisma Client is generated
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // TODO: Uncomment when authentication is set up
  // const authHeader = req.headers.authorization;
  // const token = authHeader?.startsWith('Bearer ') 
  //   ? authHeader.substring(7) 
  //   : null;

  let user = null;

  // TODO: Uncomment when Prisma is set up
  // if (token) {
  //   try {
  //     // For now, we'll use the token as the user ID directly
  //     // In production, you should verify the JWT signature using NextAuth's secret
  //     // Example: const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!)
  //     
  //     user = await prisma.user.findUnique({
  //       where: { id: token },
  //       select: {
  //         id: true,
  //         email: true,
  //         name: true,
  //         image: true,
  //       },
  //     });
  //   } catch (error) {
  //     // Invalid token or user not found
  //     console.error('Auth error:', error);
  //   }
  // }

  return {
    req,
    res,
    prisma: null as any, // TODO: Replace with actual prisma instance
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

