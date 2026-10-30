import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">J&J Travels Writing Dashboard</h1>
      <p className="mt-4">
        Welcome to your travel writing workspace.
      </p>
      <div className="mt-8 grid gap-4">
        <Link href="/dashboard/new" className="block rounded-lg border p-6 hover:bg-gray-100">
          <h2 className="text-xl font-semibold">New Post</h2>
          <p>Write a new travel story.</p>
        </Link>
        <Link href="/dashboard/edit" className="block rounded-lg border p-6 hover:bg-gray-100">
          <h2 className="text-xl font-semibold">Edit Existing Post</h2>
          <p>Continue or update an earlier story.</p>
        </Link>
        <Link href="/dashboard/drafts" className="block rounded-lg border p-6 hover:bg-gray-100">
          <h2 className="text-xl font-semibold">Saved Drafts</h2>
          <p>Return to stories that are not yet published.</p>
        </Link>
      </div>
    </main>
  );
}
