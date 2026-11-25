import Link from "next/link";
import EditStoryButton from "./EditStoryButton";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import { markdownToHtml } from "@/lib/markdown";
import { getPublishedStory } from "@/lib/publishing/getPublishedStory";
import { PostContent } from "@/components/blog/PostContent";

export default async function ExistingStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const published = await getPublishedStory(slug);

  if (!post && !published) {
    notFound();
  }

  const meta = (published?.original_metadata ?? {}) as Record<string, unknown>;
  const title = published ? String(published.title) : post!.title;
  const date = post?.date ?? (
    typeof meta.date === "string" ? meta.date :
    new Date(published!.published_at as string).toISOString().slice(0, 10)
  );
  const destination = post?.destination ?? (
    typeof meta.destination === "string" ? meta.destination : "Travel"
  );

  const storyHtml = published
    ? String(published.content)
    : await markdownToHtml(post!.content);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard/edit" className="text-blue-700 underline">
        Back to Story Search
      </Link>

      <h1 className="mt-6 text-3xl font-bold">{title}</h1>

      <p className="mt-3 text-gray-600">
        {String(date)} — {destination}
      </p>

      <p className="mt-6 font-semibold">
        Original Story Preview — Read Only
      </p>

      <p className="mt-2 text-sm">
        This preview cannot change or publish your original story.
      </p>

      <EditStoryButton slug={slug} />

      <article className="mt-8">
        <PostContent html={storyHtml} />
      </article>
    </main>
  );
}
