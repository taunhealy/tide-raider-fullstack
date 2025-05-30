import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    lemonCustomerId?: string;
    lemonSubscriptionId?: string;
    hasActiveTrial?: boolean;
    trialEndDate?: Date;
    bio?: string | null;
    skillLevel?: SkillLevel | null;
    trialEndDate: Date | null;
  }

  interface AdapterUser extends User {
    emailVerified: Date | null;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSubscribed?: boolean;
      hasActiveTrial?: boolean;
      trialEndDate?: Date | null;
    };
  }
}
