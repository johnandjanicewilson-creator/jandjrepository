import type { MDXComponents } from "mdx/types";
import type { ImageProps } from "next/image";
import Image from "next/image";
import { Gallery } from "@/components/Gallery";

function MdxImage(props: ImageProps) {
  const { src, alt, ...rest } = props;
  if (!src || typeof src !== "string") return null;

  const altText = alt ?? "";
  const showCaption = false;

  const image = (
    <Image
      src={src}
      alt={altText}
      width={800}
      height={533}
      className="mx-auto h-auto w-full max-w-[800px] rounded-xl"
      sizes="(max-width: 800px) 100vw, 800px"
      {...rest}
    />
  );

  if (!showCaption) return image;

  return (
    <figure className="my-6">
      {image}
      <figcaption className="mt-2 text-center text-sm italic text-gray-600">
        {altText}
      </figcaption>
    </figure>
  );
}

export const mdxComponents: MDXComponents = {
  Gallery,
  img: MdxImage,
};

export function useMDXComponents(): MDXComponents {
  return mdxComponents;
}
