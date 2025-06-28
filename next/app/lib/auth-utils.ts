import { signIn } from "next-auth/react";

export const handleSignIn = (callbackUrl?: string) => {
  const currentPath = window.location.pathname;
  const redirectUrl = callbackUrl || currentPath;

  return signIn("google", {
    callbackUrl: redirectUrl,
    prompt: "select_account",
  });
};
