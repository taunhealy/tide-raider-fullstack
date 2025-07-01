export function transformBeachScores(scores: Record<string, any>) {
  return Object.entries(scores).reduce(
    (
      acc: Record<string, { score: number; forecastData: any }>,
      [beachId, scoreData]
    ) => {
      acc[beachId] = {
        score: scoreData.score ?? 0,
        forecastData: scoreData.beach?.beachDailyScores?.[0]?.conditions
          ? {
              id: beachId,
              regionId: scoreData.beach.regionId,
              date: new Date(scoreData.beach.beachDailyScores[0].date),
              ...scoreData.beach.beachDailyScores[0].conditions,
            }
          : null,
      };
      return acc;
    },
    {}
  );
}
