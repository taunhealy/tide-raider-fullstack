// Temporary mock data until we have a real API
const mockAds = [
  {
    id: "1",
    title: "Premium Surfboards",
    description: "High-quality surfboards for all skill levels",
    imageUrl: "/images/ads/surfboards.jpg",
    link: "https://example.com/surfboards",
    position: "sidebar",
    isActive: true,
  },
  {
    id: "2",
    title: "Surf Gear Sale",
    description: "Up to 50% off on surf accessories",
    imageUrl: "/images/ads/sale.jpg",
    link: "https://example.com/sale",
    position: "main",
    isActive: true,
  },
];

export async function getActiveAds() {
  // TODO: Replace with actual API call when available
  return mockAds.filter((ad) => ad.isActive);
}
