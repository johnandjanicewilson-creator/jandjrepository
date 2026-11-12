"use client";

import { useEffect, useState } from "react";
import { getStagedPhotoPreview } from "@/lib/dashboard/uploads/stagePhoto";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  dragHandle?: boolean;
};

export function StagedPhotoImage({
  src,
  alt = "",
  className,
  style,
  dragHandle = false,
}: Props) {
  const [stagedPreview, setStagedPreview] = useState<{
    source: string;
    url: string;
  } | null>(null);

  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    if (!src.startsWith("jj-staged:")) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    getStagedPhotoPreview(src)
      .then((url) => {
        if (cancelled) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
          return;
        }

        objectUrl = url;
        setStagedPreview({ source: src, url });
        setFailedSource(null);
      })
      .catch(() => {
        if (!cancelled) setFailedSource(src);
      });

    return () => {
      cancelled = true;
      if (objectUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  const staged = src.startsWith("jj-staged:");
  const preview = staged
    ? stagedPreview?.source === src
      ? stagedPreview.url
      : ""
    : src;

  if (staged && failedSource === src) {
    return <span>Photograph unavailable. Please select it again.</span>;
  }

  if (!preview) {
    return <span>Preparing photograph preview...</span>;
  }

  return (
    <img
      src={preview}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
      {...(dragHandle ? { "data-drag-handle": "" } : {})}
    />
  );
}
