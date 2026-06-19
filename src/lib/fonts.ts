import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600"],
});

export const theSignature = localFont({
  src: "../../public/fonts/thesignature.ttf",
  variable: "--font-thesignature",
  display: "swap",
  fallback: ["cursive"],
});
