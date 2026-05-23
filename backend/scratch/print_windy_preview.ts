import * as fs from "fs";
import * as path from "path";

function main() {
  const filePath = path.join(__dirname, "windy_api_data.json");
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  console.log("File length:", content.length);
  console.log("First 1000 characters:");
  console.log(content.substring(0, 1000));
}

main();
