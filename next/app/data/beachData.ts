import africaBeaches from "./continents/africa.json";
import asiaBeaches from "./continents/asia.json";
import europeBeaches from "./continents/europe.json";
import northAmericaBeaches from "./continents/north-america.json";
import southAmericaBeaches from "./continents/south-america.json";
import oceaniaBeaches from "./continents/oceania.json";
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
