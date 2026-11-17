"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function TravelMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function initializeMap() {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current).setView([25, -30], 2);
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }
      ).addTo(map);
      // Load the geographic locations and their stories.
      fetch("/map-data/locations.json")
        .then((response) => {
          if (!response.ok) throw new Error("Map data unavailable");
          return response.json();
        })
        .then((locations) => {
          if (cancelled || !mapRef.current) return;

          for (const location of locations) {
            const marker = L.circleMarker(
              [location.latitude, location.longitude],
              { radius: 7, color: "#355e4b", fillOpacity: 0.85 }
            ).addTo(map);

            const content = document.createElement("div");
            const heading = document.createElement("strong");
            heading.textContent = location.place;
            content.appendChild(heading);

            const list = document.createElement("ul");
            for (const story of location.stories) {
              const item = document.createElement("li");
              const link = document.createElement("a");
              const filename = story.file.split("/").pop() || "";
              const slug = filename.replace(/\.(md|mdx)$/, "");

              link.href = `/blog/${encodeURIComponent(slug)}`;
              link.textContent = story.title;
              link.style.color = "#355e4b";
              link.style.textDecoration = "underline";

              item.appendChild(link);
              list.appendChild(item);
            }
            content.appendChild(list);
            marker.bindPopup(content);
          }
        })
        .catch((error) => console.error("Map data error:", error));

    }

    initializeMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[600px] w-full rounded-xl"
      aria-label="Interactive map of our travels"
    />
  );
}
