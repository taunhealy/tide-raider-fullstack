const fs = require('fs');
const path = require('path');

// Read beachData.ts
const beachDataPath = path.join(__dirname, '../data/beachData.ts');
const beachDataFile = fs.readFileSync(beachDataPath, 'utf8');

// Find Glencairn object
// This is a bit hacky but should work for a one-off
const startMarker = 'id: "glencairn",';
const startIndex = beachDataFile.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Glencairn not found in beachData.ts");
  process.exit(1);
}

// Find the start of the object {
let objectStart = beachDataFile.lastIndexOf('{', startIndex);
// Find the end of the object }
let braceCount = 0;
let objectEnd = -1;
for (let i = objectStart; i < beachDataFile.length; i++) {
  if (beachDataFile[i] === '{') braceCount++;
  if (beachDataFile[i] === '}') braceCount--;
  if (braceCount === 0) {
    objectEnd = i + 1;
    break;
  }
}

const glencairnString = beachDataFile.substring(objectStart, objectEnd);
console.log("Found Glencairn object string");

// We need to convert the JS object string to JSON
// Since it has unquoted keys and comments, we'll use a safer approach:
// Actually, I'll just write it manually to africa.json since I have the content in my mind.

const glencairnJson = {
  "id": "glencairn",
  "name": "Glencairn",
  "continent": "Africa",
  "countryId": "za",
  "regionId": "western-cape",
  "location": "False Bay",
  "isHiddenGem": true,
  "distanceFromCT": 35,
  "optimalWindDirections": ["ENE", "NE", "NW"],
  "optimalSwellDirections": {
    "min": 170,
    "max": 190,
    "cardinal": "S"
  },
  "bestSeasons": ["winter"],
  "optimalTide": "LOW_TO_MID",
  "description": "Protected beach break in False Bay, works best with NW winds. Good for beginners on smaller days.",
  "difficulty": "BEGINNER",
  "waveType": "BEACH_BREAK",
  "swellSize": {
    "min": 0.7,
    "max": 1.5
  },
  "idealSwellPeriod": {
    "min": 8,
    "max": 12
  },
  "waterTemp": {
    "summer": 18,
    "winter": 14
  },
  "hazards": ["Rip currents", "Sharks"],
  "crimeLevel": "Low",
  "sharkAttack": {
    "hasAttack": false
  },
  "image": "https://images.unsplash.com/photo-1666022392607-2890a8b85b8f?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "coordinates": {
    "lat": -34.1123,
    "lng": 18.4876
  }
};

const africaPath = path.join(__dirname, '../../../next/app/data/continents/africa.json');
const africaData = JSON.parse(fs.readFileSync(africaPath, 'utf8'));

// Check if already exists
const existingIndex = africaData.findIndex(b => b.id === 'glencairn');
if (existingIndex !== -1) {
  africaData[existingIndex] = glencairnJson;
  console.log("Updated existing Glencairn in africa.json");
} else {
  africaData.push(glencairnJson);
  console.log("Added Glencairn to africa.json");
}

fs.writeFileSync(africaPath, JSON.stringify(africaData, null, 2));
console.log("Successfully updated africa.json");
