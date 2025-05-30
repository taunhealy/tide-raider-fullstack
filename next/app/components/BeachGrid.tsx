import type { Beach } from "../types/beaches";
import BeachCard from "./BeachCard";

interface BeachGridProps {
  beaches: Beach[];
  isLoading?: boolean;
  onBeachClick: (beach: Beach) => void;
  children?: React.ReactNode;
}

export default function BeachGrid({
  beaches,
  isLoading = false,
  onBeachClick,
}: BeachGridProps) {
  return (
    <div className="grid grid-cols-1 gap-[16px]">
      {beaches.map((beach, index) => (
        <BeachCard
          key={beach.name}
          beach={beach}
          isFirst={index === 0}
          isLoading={isLoading}
          index={index}
          onClick={() => onBeachClick(beach)}
        />
      ))}
    </div>
  );
}
