export function transformBeachScores(scores: any) {
  const transformedScores: any = {};

  Object.keys(scores).forEach((beachId) => {
    const score = scores[beachId];
    transformedScores[beachId] = {
      score: score.score,
      beach: score.beach,
      forecastData: score.forecastData,
    };
  });

  return transformedScores;
}
