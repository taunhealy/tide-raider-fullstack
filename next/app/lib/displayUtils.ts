export interface ScoreDisplay {
    description: string;
    emoji: string;
    stars: string;
  }
  
  export function getScoreDisplay(score: number): ScoreDisplay {
    // Use floor instead of round to prevent 3.5 → 4
    const flooredScore = Math.floor(score);
    const getStars = (count: number) => "⭐".repeat(count);
  
    switch (flooredScore) {
      case 5:
        return {
          description: "Yeeeew!",
          emoji: "🤩🔥",
          stars: getStars(5),
        };
      case 4:
        return {
          description: "Surfs up?!",
          emoji: "🏄‍♂️",
          stars: getStars(4),
        };
      case 3:
        return {
          description: "Maybe, baby?",
          emoji: "👻",
          stars: getStars(3),
        };
      case 2:
        return {
          description: "Probably dog kak",
          emoji: "🐶💩",
          stars: getStars(2),
        };
      case 1:
        return {
          description: "Dog kak",
          emoji: "💩",
          stars: getStars(1),
        };
      case 0:
        return {
          description: "Horse kak",
          emoji: "🐎💩",
          stars: "",
        };
      default:
        return {
          description: "?",
          emoji: "🐎💩",
          stars: "",
        };
    }
  }