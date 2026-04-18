import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ScoreDisplay {
  description: string;
  emoji: string;
  stars: string;
}

export function getScoreDisplay(score: number): ScoreDisplay {
  const s = score / 2;

  if (s >= 4.5) return { description: "Yeeeew!", emoji: "🤩🔥", stars: "⭐".repeat(5) };
  if (s >= 3.5) return { description: "Surfs up?!", emoji: "🏄‍♂️", stars: "⭐".repeat(4) };
  if (s >= 2.5) return { description: "Maybe, baby?", emoji: "👻", stars: "⭐".repeat(3) };
  if (s >= 1.5) return { description: "Probably dog kak", emoji: "🐶💩", stars: "⭐".repeat(2) };
  if (s >= 0.5) return { description: "Dog kak", emoji: "💩", stars: "⭐".repeat(1) };
  
  return { description: "Horse kak", emoji: "🐎💩", stars: "" };
}
