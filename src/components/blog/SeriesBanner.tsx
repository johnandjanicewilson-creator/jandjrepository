import Image from "next/image";
import { getSeriesBanner } from "@/lib/series";

interface SeriesBannerProps {
  series: string | undefined;
}

export function SeriesBanner({ series }: SeriesBannerProps) {
  const banner = getSeriesBanner(series);
  if (!banner) return null;

  return (
    <div className="my-6 flex justify-center">
      <Image
        src={banner.src}
        alt={banner.alt}
        width={banner.width}
        height={banner.height}
        className="h-28 max-h-[7.5rem] w-auto max-w-full rounded-xl object-contain"
        sizes="480px"
      />
    </div>
  );
}
