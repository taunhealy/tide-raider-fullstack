import Image from "next/image";
import { WAVE_TYPE_ICONS, WaveType } from "@/app/lib/constants";
import { useBeach } from "@/app/context/BeachContext";
import { WAVE_TYPES } from "@/app/types/beaches";

interface WaveTypeFilterProps {
  selectedWaveTypes: WaveType[];
  onWaveTypeChange: (waveTypes: WaveType[]) => void;
  waveTypes: readonly WaveType[];
}

export default function WaveTypeFilter({
  selectedWaveTypes,
  onWaveTypeChange,
  waveTypes,
}: WaveTypeFilterProps) {
  const { filters, setFilters } = useBeach();

  return (
    <div className="mb-6 overflow-x-auto pb-2">
      <div className="flex flex-nowrap gap-2 min-w-max">
        {waveTypes.map((waveType) => (
          <button
            key={waveType}
            onClick={() => {
              const newWaveTypes = selectedWaveTypes.includes(waveType)
                ? selectedWaveTypes.filter((t) => t !== waveType)
                : ([...selectedWaveTypes, waveType] as WaveType[]);
              onWaveTypeChange(newWaveTypes);

              // This is important - dispatch it to Redux
              setFilters({ ...filters, waveType: newWaveTypes });
            }}
            className={`
              relative w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] lg:w-[80px] lg:h-[80px] 
              rounded-lg overflow-hidden cursor-pointer
              hover:opacity-90 transition-all duration-200
              ${
                selectedWaveTypes.includes(waveType)
                  ? "ring-2 ring-[var(--color-bg-tertiary)]"
                  : "border border-gray-200"
              }
              bg-gray-100
            `}
          >
            {/* Explicit loading state */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse z-10">
              <span className="text-xs text-gray-500 font-primary">
                {waveType}
              </span>
            </div>

            <Image
              src={WAVE_TYPE_ICONS[waveType as WaveType]}
              alt={`${waveType} icon`}
              fill
              className="object-cover z-20"
              sizes="(max-width: 640px) 60px, (max-width: 1024px) 70px, 80px"
              priority={
                selectedWaveTypes.includes(waveType) ||
                WAVE_TYPES.indexOf(waveType) < 3
              }
              quality={80}
              onLoad={(e) => {
                // Hide the loading state when image loads
                const target = e.target as HTMLImageElement;
                target.style.zIndex = "20";
                target.previousElementSibling?.classList.add("hidden");
              }}
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-30">
              <div className="absolute inset-0 bg-black opacity-30"></div>
              <div className="absolute inset-0 bg-[var(--color-tertiary)] opacity-50"></div>
              <span className="relative z-10 text-white text-xs font-medium px-2 text-center font-primary">
                {waveType}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
