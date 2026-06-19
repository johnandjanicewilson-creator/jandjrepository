export interface PostFrontmatter {
  title: string;
  date: string;
  /** When the trip/events occurred; shown in the UI when set. */
  dateline?: string;
  /** Named series for grouped posts (e.g. Walkabout Canada-Alaska). */
  series?: string;
  excerpt: string;
  destination: string;
  region?: string;
  year: number;
  categories: string[];
  tags: string[];
  featuredImage: string;
  featuredImageAlt?: string;
  gallery?: GalleryImage[];
  places?: string[];
  draft?: boolean;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

export type PostFormat = "md" | "mdx";

export interface Post extends PostFrontmatter {
  slug: string;
  content: string;
  readingTime: string;
  format: PostFormat;
}

export interface DestinationGroup {
  name: string;
  slug: string;
  region: string;
  postCount: number;
  coverImage: string;
  latestYear: number;
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  destination: string;
  year: number;
  featuredImage: string;
  date: string;
  dateline?: string;
  series?: string;
}
