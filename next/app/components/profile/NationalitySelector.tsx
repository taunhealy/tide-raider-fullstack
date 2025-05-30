import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/input";
import { countries } from "countries-list";
import { Check } from "lucide-react";

interface NationalitySelectorProps {
  currentFlag: string;
  isOwnProfile: boolean;

  onSelect: (countryCode: string) => void;
}

type CountryWithEmoji = {
  name: string;
  emoji: string;
};

export default function NationalitySelector({
  currentFlag,
  isOwnProfile,
  onSelect,
}: NationalitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Add logging to debug
  console.log("NationalitySelector currentFlag:", currentFlag);

  const countryList = Object.entries(countries).map(([code, data]) => ({
    code,
    name: data.name,
    emoji: getFlagEmoji(code),
  }));

  const getEmoji = () => {
    // Add logging to debug
    console.log("getEmoji called with:", currentFlag);
    if (!currentFlag) return "🏴‍☠️";
    return getFlagEmoji(currentFlag);
  };

  if (!isOwnProfile) {
    return <span className="text-2xl cursor-default">{getEmoji()}</span>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-2xl hover:opacity-80 transition-opacity"
      >
        {getEmoji()}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-2">
            <Input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full font-primary"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {countryList
              .filter((country) =>
                country.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    console.log("Selecting country:", country.code); // Add logging
                    onSelect(country.code);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 font-primary"
                >
                  <span>{getFlagEmoji(country.code)}</span>
                  <span>{country.name}</span>
                  {currentFlag === country.code && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
