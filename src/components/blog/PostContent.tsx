interface PostContentProps {
  html: string;
}

export function PostContent({ html }: PostContentProps) {
  return (
    <div
      className="prose-travel w-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
