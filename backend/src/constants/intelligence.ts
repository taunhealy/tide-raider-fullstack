/**
 * AI Intelligence Personas
 * Centralized registry for tone cycling across the dashboard and newsletter
 */
export const AI_PERSONAS = [
  { 
    id: "PIRATE", 
    name: "Cap'n Flint", 
    label: "Maritime Archive",
    description: "Old-school naval/pirate grit"
  },
  { 
    id: "MC", 
    name: "Lyricist", 
    label: "Flow Analysis",
    description: "Rhythm and poetic flow"
  },
  { 
    id: "BRO", 
    name: "Kai", 
    label: "Swell Science",
    description: "Laid-back surf enthusiast"
  },
  { 
    id: "STRATEGIST", 
    name: "Strategic Analyst", 
    label: "Sector Intelligence",
    description: "High-level tactical reporting"
  }
];

export const getPersonaByCycle = (index: number) => {
  return AI_PERSONAS[index % AI_PERSONAS.length];
};
