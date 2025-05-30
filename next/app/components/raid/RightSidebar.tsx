import { useAppSelector } from "@/app/redux/hooks";
import WeatherForecastWidget from "../sidebar/WeatherForecastWidget";
import AdventureExperiences from "../AdventureExperiences";
import RegionalHighScores from "../RegionalHighScores";
import RegionalSidebar from "../RegionalServicesSidebar";
import FunFacts from "../FunFacts";

interface RightSidebarProps {
  availableAds: any[];
  selectedRegion?: string;
  beaches?: any[];
}

export default function RightSidebar({
  availableAds,
  selectedRegion = "Western Cape",
  beaches = [],
}: RightSidebarProps) {
  const { data: windData } = useAppSelector((state) => state.forecast);
  const { allBeaches } = useAppSelector((state) => state.beaches);

  const handleBeachClick = (beach: any) => {
    // Implement beach click handler logic
  };

  return (
    <aside className="space-y-6 lg:w-[250px] xl:w-[300px]">
      {/* Keep existing components */}
      <WeatherForecastWidget windData={windData} />

      {/* Add new components */}
      {selectedRegion && (
        <RegionalHighScores
          beaches={allBeaches}
          selectedRegion={selectedRegion}
          onBeachClick={handleBeachClick}
        />
      )}

      <AdventureExperiences selectedRegion={selectedRegion} />

      <RegionalSidebar selectedRegion={selectedRegion} ads={availableAds} />

      <FunFacts />
    </aside>
  );
}
