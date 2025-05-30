import { cn } from "@/app/lib/utils";

interface Props {
  region: string;
}

const swellInsights = {
  atlantic: {
    name: "Atlantic-facing beaches",
    examples: "Llandudno, Camps Bay, Sea Point",
    swellRange: "SW to NW (225° - 315°)",
    description:
      "Work best with SE winds and SW-NW swells. Best conditions typically in summer months with morning offshores. Heavy waves and strong currents, not suitable for beginners unless there's small swell.",
  },
  falseBay: {
    name: "False Bay beaches",
    examples: "Muizenberg, Clovelly, Fish Hoek, Glencairn",
    swellRange: "SE to SW (135° - 225°)",
    description:
      "Best in early mornings before SE winds pick up. Works well with SE-SW swells. Generally more suitable for beginners due to gentler waves. Muizenberg is perfect for beginners, especially on a smaller swell with offshore N/NW wind. Glencairn is not particularily beginner friendly due to the fast, close-out shorebreak. It's a stretch to even call it a surf spot, but it's fun to frolick around and get a surf/yoga lesson. Good snorkeling at the Glencairn point, close to the tidal pool. Fish Hoek and Clovelly are also less surfable than Muizenberg, similar, less heavy conditions to Glencairn. Muizenberg is king, with plenty of surf rental stores and peaks to choose from.",
  },
  kommetjie: {
    name: "Kommetjie area",
    examples: "Long Beach, Outer/Inner Kom",
    swellRange: "S to SW (157.5° - 247.5°)",
    description:
      "Consistent surf zone working best with S to SW swells. Handles size well. Be careful with the rocks, shallow shorebreak and local sharks (the people...they don't get out the Valley much, bless them). Suitable for intermediate surfers, not beginner friendly at any stretch of the imagination. Due to small takeoff zone at main peak and the frothing locals, there's usually a crowded, competitive lineup. Paddle around the left point for a more chilled reef break and lineup. In summary- avoid the groms. If you find yourself in the Sardine Run frenzy of main peak, perhaps question your life choices, and don't hesitate to dish out some lessons in basic surf etiquette. Otherwise, otherwise, lovely beaches and rad people.",
  },
};

export default function Insights({ region }: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
      <h3 className={cn("heading-6 text-gray-800 mb-4")}>Regional Insights</h3>

      <div className="space-y-4">
        {Object.values(swellInsights).map((insight) => (
          <div
            key={insight.name}
            className="bg-gray-50 p-4 rounded-lg border border-gray-100"
          >
            <h6 className={cn("heading-6 text-gray-900 mb-2")}>
              {insight.name}
            </h6>
            <p className="text-small text-gray-500 mb-2">
              Notable spots: {insight.examples}
            </p>
            <p className="text-small text-[var(--color-tertiary)] mb-1">
              Optimal swell: {insight.swellRange}
            </p>
            <p className="text-small text-gray-600 leading-relaxed">
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
