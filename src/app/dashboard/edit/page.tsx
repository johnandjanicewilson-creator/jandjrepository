import { getAllPosts } from "@/lib/posts";
import StorySearch from "./StorySearch";

export default function EditExistingPostPage() {
  const posts = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    date: String(post.date),
    destination: post.destination,
  }));

  return <StorySearch posts={posts} />;
}
