import type { Beach } from "@/app/types/beaches";
import type { WindData } from "@/app/types/wind";
import { useSubscription } from "../context/SubscriptionContext";

interface RaidAdvisorProps {
  beaches: Beach[];
  windData: WindData | null;
  isBeachSuitable: (beach: Beach, conditions: WindData) => any;
}

export default function RaidAdvisor({ beaches, windData, isBeachSuitable }: RaidAdvisorProps) {
  const { isSubscribed } = useSubscription();
  
  if (!windData) return null;

  // Sort beaches by suitability score
  const rankedBeaches = beaches
    .map(beach => ({
      beach,
      score: isBeachSuitable(beach, windData).score
    }))
    .sort((a, b) => b.score - a.score);

  // Get top 5 recommendations
  const visibleSpots = rankedBeaches.slice(0, 3);
  const lockedSpots = rankedBeaches.slice(3, 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Wave Hunt Advisor</h2>
      
      <div className="space-y-6">
        {/* Visible Spots */}
        {visibleSpots.map(({ beach, score }) => (
          <div key={beach.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800">{beach.name}</h3>
            <div className="text-yellow-500">{"⭐".repeat(score)}</div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Wave Size: {beach.waveSize.min}-{beach.waveSize.max}m</p>
              <p>Best Tide: {beach.optimalTide}</p>
              <p>Difficulty: {beach.difficulty}</p>
            </div>
          </div>
        ))}

        {/* Locked Spots */}
        {!isSubscribed && lockedSpots.map(({ beach, score }) => (
          <div key={beach.name} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </h3>
            </div>
            <div className="text-yellow-500">{"⭐".repeat(score)}</div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Region: {beach.region}</p>
              <p>Difficulty: {beach.difficulty}</p>
              <p className="text-gray-400 italic mt-2">Subscribe to unlock spot name and details</p>
            </div>
          </div>
        ))}

        {/* Subscribe CTA */}
        {!isSubscribed && (
          <div className="text-center mt-8">
            <p className="text-gray-600 font-medium">
              Subscribe to unlock more surf spot recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
