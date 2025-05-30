export default function UserNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] font-primary">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-[var(--color-text-primary)] font-primary">
          User Not Found
        </h1>
        <p className="mb-6 text-[var(--color-text-secondary)] font-primary">
          The user you're looking for has either wiped out or never existed.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[var(--color-bg-tertiary)] hover:opacity-90 transition-opacity"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
