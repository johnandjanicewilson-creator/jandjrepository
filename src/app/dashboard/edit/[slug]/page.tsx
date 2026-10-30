import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import { markdownToHtml } from "@/lib/markdown";

export default async function ExistingStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post || post.draft) {
    notFound();
  }

  const storyHtml = await markdownToHtml(post.content);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard/edit" className="text-blue-700 underline">
        Back to Story Search
      </Link>

      <h1 className="mt-6 text-3xl font-bold">{post.title}</h1>

      <p className="mt-3 text-gray-600">
        {String(post.date)} — {post.destination}
      </p>

      <p className="mt-6 font-semibold">
        Original Story Preview — Read Only
      </p>

      <p className="mt-2 text-sm">
        This preview cannot change or publish your original story.
      </p>

      <article
        className="prose mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: storyHtml }}
      />
    </main>
  );
}
