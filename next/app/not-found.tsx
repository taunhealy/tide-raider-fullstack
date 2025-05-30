import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] font-primary">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-[var(--color-text-primary)] font-primary">
          404 - Page Not Found
        </h2>
        <p className="mb-6 text-[var(--color-text-secondary)] font-primary">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="font-primary inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--color-bg-tertiary)] hover:opacity-90 transition-opacity"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
