import { Container } from "@/components/ui/Container";
import TravelMap from "@/components/map/TravelMap";

export default function MapPage() {
  return (
    <main className="py-12">
      <Container>
        <h1 className="font-display text-3xl font-semibold text-sage">
          Explore Our Travels
        </h1>
        <p className="mt-3 text-muted">
          Discover the places we've visited and the stories behind them.
        </p>
        <div
          id="travel-map"
          className="mt-8 h-[600px] rounded-xl border border-border"
        >
          <TravelMap />
        </div>
      </Container>
    </main>
  );
}
