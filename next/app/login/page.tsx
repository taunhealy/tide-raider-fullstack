import { headers } from "next/headers";
import LoginButton from "@/app/login/LoginButton";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const headersList = await headers();
  const callbackUrl = headersList.get("referer") || "/";

  return (
    <div className="mt-6">
      <div className=" max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md font-primary">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign In</h1>

        <LoginButton callbackUrl={callbackUrl} />

        <p className="font-primary mt-4 text-sm text-gray-600 text-center">
          You'll be redirected to:
        </p>
        <p className="font-primary p-2 text-sm text-gray-300 text-center">
          {callbackUrl}
        </p>
      </div>
    </div>
  );
}
