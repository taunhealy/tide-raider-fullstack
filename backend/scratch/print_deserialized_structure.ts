import * as fs from "fs";
import * as path from "path";

function main() {
  const filePath = path.join(__dirname, "deserialized_props.json");
  if (!fs.existsSync(filePath)) {
    console.error("deserialized_props.json not found.");
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  
  console.log("top-level keys:", Object.keys(data));
  const fcSectionData = data.fcSectionData;
  console.log("fcSectionData type:", typeof fcSectionData, Array.isArray(fcSectionData) ? `Array (${fcSectionData.length})` : "");
  
  if (Array.isArray(fcSectionData)) {
    console.log("fcSectionData[0]:", typeof fcSectionData[0], JSON.stringify(fcSectionData[0]).substring(0, 500));
    console.log("fcSectionData[1]:", typeof fcSectionData[1], JSON.stringify(fcSectionData[1]).substring(0, 500));
  }
}

main();
