import LoginButton from "@/app/login/LoginButton";

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
