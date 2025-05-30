import type { RedirectableProviderType, SignOutParams } from "@auth/core/providers";
import type { AstroSignInOptions } from "auth-astro/client";

declare global {
  interface Window {
    signIn: (providerId?: RedirectableProviderType, options?: AstroSignInOptions, authorizationParams?: Record<string, string>) => Promise<Response | undefined>;
    signOut: (options?: SignOutParams) => Promise<void>;
    handleSubscribe: () => Promise<void>;
    handleUnsubscribe: () => Promise<void>;
  }
}

export {};
