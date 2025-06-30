import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ScoreDisplay {
  description: string;
  emoji: string;
  stars: string;
}

export function getScoreDisplay(score: number): ScoreDisplay {
  // Convert score from 0-10 scale back to 0-5 scale
  const scoreOutOfFive = score / 2;

  switch (Math.floor(scoreOutOfFive)) {
    case 5:
      return { description: "Yeeeew!", emoji: "🤩🔥", stars: "⭐".repeat(5) };
    case 4:
      return { description: "Surfs up?!", emoji: "🏄‍♂️", stars: "⭐".repeat(4) };
    case 3:
      return {
        description: "Maybe, baby?",
        emoji: "👻",
        stars: "⭐".repeat(3),
      };
    case 2:
      return {
        description: "Probably dog kak",
        emoji: "🐶💩",
        stars: "⭐".repeat(2),
      };
    case 1:
      return { description: "Dog kak", emoji: "💩", stars: "⭐".repeat(1) };
    case 0:
      return { description: "Horse kak", emoji: "🐎💩", stars: "" };
    default:
      return { description: "?", emoji: "🐎💩", stars: "" };
  }
}
