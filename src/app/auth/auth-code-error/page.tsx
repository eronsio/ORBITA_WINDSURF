import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold text-neutral-800 mb-2">
          Authentication Error
        </h1>
        <p className="text-neutral-600 mb-4">
          There was a problem signing you in. The link may have expired or already been used.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
