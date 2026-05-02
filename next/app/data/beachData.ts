import africaBeaches from "../../../backend/src/data/continents/africa.json";
import asiaBeaches from "../../../backend/src/data/continents/asia.json";
import europeBeaches from "../../../backend/src/data/continents/europe.json";
import northAmericaBeaches from "../../../backend/src/data/continents/north-america.json";
import southAmericaBeaches from "../../../backend/src/data/continents/south-america.json";
import oceaniaBeaches from "../../../backend/src/data/continents/oceania.json";
import { Beach } from "../types/beaches";

// Combine all continent data into a single array for backward compatibility
export const beachData: Beach[] = [
  ...(africaBeaches as Beach[]),
  ...(asiaBeaches as Beach[]),
  ...(europeBeaches as Beach[]),
  ...(northAmericaBeaches as Beach[]),
  ...(southAmericaBeaches as Beach[]),
  ...(oceaniaBeaches as Beach[]),
];
