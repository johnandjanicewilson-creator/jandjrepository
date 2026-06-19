export const SITE = {
  name: "John and Janice's Travel Adventures",
  shortName: "John & Janice Travel",
  tagline: "Our journeys from 2011 to today",
  description:
    "A travel blog documenting adventures around the world by John and Janice — from city breaks to remote trails, since 2011.",
  url: "https://johnandjanice.com",
  email: "hello@johnandjanice.com",
  since: 2011,
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/destinations", label: "Destinations" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: "instagram",
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: "facebook",
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com",
    icon: "pinterest",
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: "youtube",
  },
] as const;
