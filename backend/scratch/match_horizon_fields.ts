import * as fs from "fs";
import * as path from "path";

function main() {
  const scratchDir = __dirname;
  
  // Read deserialized props
  const propsPath = path.join(scratchDir, "deserialized_props.json");
  if (!fs.existsSync(propsPath)) return;
  const props = JSON.parse(fs.readFileSync(propsPath, "utf-8"));
  
  const fcSectionData = props.fcSectionData;
  if (!Array.isArray(fcSectionData)) return;
  
  // Flatten all days and horizons
  const horizonsList: any[] = [];
  fcSectionData.flat().forEach((day: any) => {
    if (day.horizons) {
      day.horizons.forEach((h: any) => {
        horizonsList.push(h);
      });
    }
  });

  console.log(`Total horizons in JSON: ${horizonsList.length}`);
  
  // Let's find horizons with dt/dtl matching our expected hour (e.g. 07:00:00 local time)
  // Let's print out the first 12 horizons with their dtl, ws, and other fields
  horizonsList.slice(0, 12).forEach((h: any) => {
    const dtl = h.fcData.dtl;
    console.log(`Local Time: ${dtl} | ws (JSON): ${h.fcData.ws} | wg (JSON): ${h.fcData.wg} | wah: ${h.fcData.wah} | wap: ${h.fcData.wap} | th: ${h.tideData?.th} | tp: ${h.tideData?.tp}`);
  });
}

main();
