import LoginButton from "@/app/login/LoginButton";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const awaitedSearchParams = (await searchParams) || {};

  // Get callback URL from query param, or default to /raid
  const callbackUrlParam = Array.isArray(awaitedSearchParams.callbackUrl)
    ? awaitedSearchParams.callbackUrl[0]
    : awaitedSearchParams.callbackUrl;
  const callbackUrl =
    (typeof callbackUrlParam === "string" ? callbackUrlParam : null) || "/raid";

  // If user already has auth-token cookie, redirect them immediately to the callback URL
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (token) {
    redirect(callbackUrl);
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[var(--color-bg-secondary)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 md:p-10 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
        <div className="text-center mb-10">
          <h1 className="font-primary text-[32px] font-bold tracking-[-0.05em] text-black mb-2">
            Sign In
          </h1>
          <p className="font-primary text-[14px] text-gray-500 font-medium">
            Welcome to the Tide Raider Intel platform
          </p>
        </div>

        <LoginButton callbackUrl={callbackUrl} />

      </div>
    </div>
  );
}
