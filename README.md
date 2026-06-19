# John and Janice's Travel Adventures

A modern, photo-focused travel blog built with **Next.js** (App Router) and **Tailwind CSS**. Documents trips from 2011 to the present using Markdown content files.

## Features

- **Pages:** Home, Blog, Destinations, About, Contact, Search
- **Markdown posts** with frontmatter (categories, tags, dates, galleries)
- **Filtering** by destination, year, category, and tag
- **Search** across titles, excerpts, and metadata
- **Related posts** based on destination, category, and tags
- **Image optimization** via `next/image`
- **SEO:** metadata, sitemap, robots.txt, semantic URLs

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding blog posts

Create a new `.md` file in `content/posts/`:

```md
---
title: "Your Post Title"
date: "2025-06-01"
excerpt: "Short summary for cards and SEO."
destination: "City or Region"
region: "Europe"
year: 2025
categories:
  - "Europe"
tags:
  - "food"
featuredImage: "https://images.unsplash.com/photo-..."
featuredImageAlt: "Description for accessibility"
gallery:
  - src: "https://..."
    alt: "Gallery image"
    caption: "Optional caption"
---

Your markdown content here.
```

The filename becomes the URL slug: `content/posts/my-trip.md` → `/blog/my-trip`.

## Project structure

```
content/posts/          # Markdown blog posts
public/                 # Static assets
src/
  app/                  # App Router pages & API routes
  components/           # UI, layout, blog components
  lib/                  # Posts loader, markdown, utilities
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | Run ESLint               |

## Customization

- **Site info:** `src/lib/constants.ts`
- **Colors & typography:** `src/app/globals.css`
- **Remote images:** `next.config.ts` (`images.remotePatterns`)

## Deploy

Deploy to [Vercel](https://vercel.com) or any Node.js host that supports Next.js. No environment variables are required for the default setup.
