// Maps destinations to the places (cities, parks, points of interest) within them.
// Single source of truth — adding a new place is a one-line edit here.

export type PlaceType = "city" | "park" | "point_of_interest";

export interface Place {
  slug: string;
  name: string;
  type: PlaceType;
}

export interface DestinationTaxonomy {
  slug: string;
  name: string;
  region: string;
  cities: Place[];
  parks: Place[];
  pointsOfInterest: Place[];
}

export const DESTINATIONS: Record<string, DestinationTaxonomy> = {
  alaska: {
    slug: "alaska",
    name: "Alaska",
    region: "North America",
    cities: [
      { slug: "fairbanks", name: "Fairbanks", type: "city" },
      { slug: "anchorage", name: "Anchorage", type: "city" },
      { slug: "juneau", name: "Juneau", type: "city" },
      { slug: "homer", name: "Homer", type: "city" },
      { slug: "soldotna", name: "Soldotna", type: "city" },
      { slug: "seward", name: "Seward", type: "city" },
      { slug: "valdez", name: "Valdez", type: "city" },
      { slug: "whittier", name: "Whittier", type: "city" },
      { slug: "talkeetna", name: "Talkeetna", type: "city" },
      { slug: "tok", name: "Tok", type: "city" },
    ],
    parks: [
      { slug: "denali-national-park", name: "Denali National Park", type: "park" },
    ],
    pointsOfInterest: [
      { slug: "hatcher-pass", name: "Hatcher Pass", type: "point_of_interest" },
      { slug: "independence-mine", name: "Independence Mine", type: "point_of_interest" },
      { slug: "diamond-m-ranch", name: "Diamond M Ranch", type: "point_of_interest" },
      { slug: "silver-gulch", name: "Silver Gulch Brewery", type: "point_of_interest" },
      { slug: "north-star-golf", name: "North Star Golf Club", type: "point_of_interest" },
      { slug: "aurora-ice-museum", name: "Aurora Ice Museum", type: "point_of_interest" },
      { slug: "top-of-the-world-highway", name: "Top of the World Highway", type: "point_of_interest" },
      { slug: "chicken-alaska", name: "Chicken, Alaska", type: "point_of_interest" },
      { slug: "hope-alaska", name: "Hope, Alaska", type: "point_of_interest" },
    ],
  },
  yukon: {
    slug: "yukon",
    name: "Yukon",
    region: "North America",
    cities: [
      { slug: "dawson-city", name: "Dawson City", type: "city" },
      { slug: "whitehorse", name: "Whitehorse", type: "city" },
    ],
    parks: [],
    pointsOfInterest: [],
  },
  "british-columbia": {
    slug: "british-columbia",
    name: "British Columbia",
    region: "North America",
    cities: [
      { slug: "dawson-creek", name: "Dawson Creek", type: "city" },
    ],
    parks: [],
    pointsOfInterest: [
      { slug: "liard-hot-springs", name: "Liard Hot Springs", type: "point_of_interest" },
      { slug: "mile-marker-zero", name: "Mile Marker Zero", type: "point_of_interest" },
    ],
  },
  alberta: {
    slug: "alberta",
    name: "Alberta",
    region: "North America",
    cities: [
      { slug: "jasper", name: "Jasper", type: "city" },
      { slug: "lake-louise", name: "Lake Louise", type: "city" },
      { slug: "banff", name: "Banff", type: "city" },
      { slug: "grande-prairie", name: "Grande Prairie", type: "city" },
    ],
    parks: [
      { slug: "jasper-national-park", name: "Jasper National Park", type: "park" },
      { slug: "banff-national-park", name: "Banff National Park", type: "park" },
    ],
    pointsOfInterest: [
      { slug: "icefields-parkway", name: "Icefields Parkway", type: "point_of_interest" },
      { slug: "columbia-icefield", name: "Columbia Icefield", type: "point_of_interest" },
      { slug: "athabasca-glacier", name: "Athabasca Glacier", type: "point_of_interest" },
      { slug: "maligne-canyon", name: "Maligne Canyon", type: "point_of_interest" },
      { slug: "maligne-lake", name: "Maligne Lake", type: "point_of_interest" },
      { slug: "bow-glacier", name: "Bow Glacier", type: "point_of_interest" },
      { slug: "crowfoot-glacier", name: "Crowfoot Glacier", type: "point_of_interest" },
      { slug: "fairmont-banff-springs", name: "Fairmont Banff Springs Hotel", type: "point_of_interest" },
    ],
  },
};

export function getPlacesForDestination(slug: string): Place[] {
  const dest = DESTINATIONS[slug];
  if (!dest) return [];
  return [...dest.cities, ...dest.parks, ...dest.pointsOfInterest];
}

export function getPlaceBySlug(
  destinationSlug: string,
  placeSlug: string
): Place | undefined {
  return getPlacesForDestination(destinationSlug).find(
    (p) => p.slug === placeSlug
  );
}

export function getAllDestinationTaxonomies(): DestinationTaxonomy[] {
  return Object.values(DESTINATIONS);
}

export function getDestinationByPlaceSlug(
  placeSlug: string
): DestinationTaxonomy | undefined {
  for (const dest of Object.values(DESTINATIONS)) {
    const allPlaces = [
      ...dest.cities,
      ...dest.parks,
      ...dest.pointsOfInterest,
    ];
    if (allPlaces.find((p) => p.slug === placeSlug)) {
      return dest;
    }
  }
  return undefined;
}
