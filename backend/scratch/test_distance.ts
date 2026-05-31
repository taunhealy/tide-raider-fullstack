function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const userLocation = { lat: -33.9249, lng: 18.4241 }; // Cape Town
const beachLat = -34.1083; // Muizenberg
const beachLng = 18.4702;

const distance = calculateDistance(userLocation.lat, userLocation.lng, beachLat, beachLng);
console.log(`Distance from Cape Town to Muizenberg: ${distance} km`);
