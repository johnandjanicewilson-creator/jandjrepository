export const WALKABOUT_CANADA_ALASKA = "Walkabout Canada-Alaska";

export const SERIES_BANNERS: Record<
  string,
  { src: string; alt: string; width: number; height: number }
> = {
  [WALKABOUT_CANADA_ALASKA]: {
    src: "https://res.cloudinary.com/dsru5pryd/image/upload/f_auto,q_auto/images/walkabout-banner.jpg",
    alt: "Part of the Walkabout Canada-Alaska series",
    width: 1600,
    height: 400,
  },
};

export function getSeriesBanner(series: string | undefined) {
  if (!series) return undefined;
  return SERIES_BANNERS[series];
}
