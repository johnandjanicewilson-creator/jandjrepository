import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/mdx-components";

interface PostMdxProps {
  /** Post body only — frontmatter is stripped by gray-matter in posts.ts */
  content: string;
}

export async function PostMdx({ content }: PostMdxProps) {
  const { content: rendered } = await compileMDX({
    source: content,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        format: 'mdx',
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return <div className="prose-travel w-full">{rendered}</div>;
}
