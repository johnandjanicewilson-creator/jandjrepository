// Functions for querying posts and places within destinations.
// Builds on the taxonomy in src/lib/taxonomy.ts and the post data in src/lib/posts.ts.

import type { Place } from "./taxonomy";
import { DESTINATIONS } from "./taxonomy";
import type { Post } from "./types";
import { getPostsByDestination } from "./posts";

export interface ActivePlace extends Place {
  postCount: number;
  coverImage?: string;
}

export interface ActivePlacesForDestination {
  cities: ActivePlace[];
  parks: ActivePlace[];
  pointsOfInterest: ActivePlace[];
}

/**
 * Returns places within a destination that have at least one post pointing to them.
 * Each place is enriched with the post count and a cover image from the most recent post.
 */
export function getActivePlacesForDestination(
  destinationSlug: string
): ActivePlacesForDestination {
  const taxonomy = DESTINATIONS[destinationSlug];
  if (!taxonomy) {
    return { cities: [], parks: [], pointsOfInterest: [] };
  }

  const posts = getPostsByDestination(destinationSlug);

  // Aggregate: post count per place + cover image from latest post for each place.
  // Posts come back in date-desc order, so the first post we see for a place is the most recent.
  const placeData = new Map<string, { count: number; coverImage: string }>();

  for (const post of posts) {
    for (const placeSlug of post.places ?? []) {
      const existing = placeData.get(placeSlug);
      if (existing) {
        existing.count++;
      } else {
        placeData.set(placeSlug, {
          count: 1,
          coverImage: post.featuredImage,
        });
      }
    }
  }

  const enrich = (places: Place[]): ActivePlace[] =>
    places
      .filter((p) => placeData.has(p.slug))
      .map((p) => ({
        ...p,
        postCount: placeData.get(p.slug)!.count,
        coverImage: placeData.get(p.slug)!.coverImage,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  return {
    cities: enrich(taxonomy.cities),
    parks: enrich(taxonomy.parks),
    pointsOfInterest: enrich(taxonomy.pointsOfInterest),
  };
}

/** Returns posts within a destination that touch a specific place. */
export function getPostsByPlace(
  destinationSlug: string,
  placeSlug: string
): Post[] {
  return getPostsByDestination(destinationSlug).filter((post) =>
    (post.places ?? []).includes(placeSlug)
  );
}
