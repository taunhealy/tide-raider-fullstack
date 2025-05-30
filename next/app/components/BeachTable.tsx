import type { Beach } from "../types/beaches";
import type { WindData } from "../types/wind";

interface BeachTableProps {
  beaches: Beach[];
  windData: WindData | null;
  isBeachSuitable: (beach: Beach, conditions: WindData) => any;
}

export default function BeachTable({
  beaches,
  windData,
  isBeachSuitable,
}: BeachTableProps) {
  return (
    <div className="beaches-table">
      <table>
        <thead>
          <tr>
            <th>Beach</th>
            <th>Current Status</th>
            <th>Optimal Winds</th>
            <th>Wave Size (m)</th>
            <th>Ideal Swell Period (s)</th>
            <th>Best Swell Direction</th>
            <th>Crime Risk</th>
            <th>Shark Risk</th>
            <th>Hazards</th>
            <th>Difficulty</th>
            <th>Wave Type</th>
            <th>Description</th>
            <th>Distance from Cape Town</th>
          </tr>
        </thead>
        <tbody>
          {beaches.map((beach) => {
            const suitability = windData
              ? isBeachSuitable(beach, windData)
              : null;
            return (
              <tr
                key={beach.name}
                className={suitability?.suitable ? "suitable" : ""}
              >
                <td>{beach.name}</td>
                <td className="status">
                  {suitability ? (
                    <div className="status-container">
                      <span>
                        {suitability.score === 4
                          ? "🏄‍♂️ YEEEWWWW!"
                          : suitability.score === 3
                          ? "🏄‍♂️"
                          : suitability.score === 2
                          ? "👍"
                          : suitability.score === 1
                          ? "🤔"
                          : "💩"}
                      </span>
                      <span className="score-badge">
                        {"⭐".repeat(suitability.score)}
                      </span>
                    </div>
                  ) : (
                    ""
                  )}
                </td>
                <td>{beach.optimalWindDirections.join(", ")}</td>
                <td>
                  {beach.swellSize.min}-{beach.swellSize.max}m
                </td>
                <td>
                  {beach.idealSwellPeriod.min}-{beach.idealSwellPeriod.max}s
                </td>
                <td>
                  {beach.optimalSwellDirections.min}° -{" "}
                  {beach.optimalSwellDirections.max}°
                </td>
                <td>
                  {beach.crimeLevel === "High"
                    ? "💀"
                    : beach.crimeLevel === "Medium"
                    ? "⚠️"
                    : "👮"}
                </td>
                <td>
                  <span title={
                    beach.sharkAttack.hasAttack 
                      ? beach.sharkAttack.incidents?.map(i => 
                          `${i.date}: ${i.outcome} - ${i.details}`
                        ).join('\n')
                      : "No shark attacks reported"
                  }>
                    {beach.sharkAttack.hasAttack ? "🦈" : "❌"}
                  </span>
                </td>
                <td>{beach.hazards.join(", ")}</td>
                <td>{beach.difficulty}</td>
                <td>{beach.waveType}</td>
                <td>{beach.description}</td>
                <td>{beach.distanceFromCT}km</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
