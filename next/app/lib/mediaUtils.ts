import { Ad } from "@/app/types/ads";

interface MediaItem {
  url: string;
  title: string;
  platform: "youtube" | "vimeo";
}

interface CoffeeShop {
  name: string;
}

interface Beach {
  id: string;
  name: string;
  advertisingPrice?: number;
  shaper?: { name: string; url?: string }[];
  beer?: { name: string; url?: string }[];
  region: string;
}

export function getMediaGridItems(
  videos: MediaItem[] = [],
  coffeeShops: CoffeeShop[] = [],
  beach: Beach,
  ads: Ad[] = []
) {
  const items = [];

  // Debug logs
  console.log("Processing ads for beach:", beach.name, {
    totalAds: ads?.length,
    beachId: beach.id,
  });

  // Ensure ads is an array and filter active ads for this beach
  const beachAds = (Array.isArray(ads) ? ads : []).filter((ad) => {
    const isActive = ad.status === "active";
    const isTargeted =
      ad.targetedBeaches?.includes(beach.id) ||
      ad.beachConnections?.some((conn) => conn.beachId === beach.id);

    return isActive && isTargeted;
  });

  // Group ads by category
  const adsByCategory = beachAds.reduce(
    (acc, ad) => {
      if (!acc[ad.category]) acc[ad.category] = [];
      acc[ad.category].push(ad);
      return acc;
    },
    {} as Record<string, Ad[]>
  );

  // Add videos first
  if (videos?.length) {
    items.push(
      ...videos.map((video) => ({
        type: "video",
        ...video,
      }))
    );
  }

  // Add services (prioritizing ads over regular listings)
  const categories = ["surf_camp", "coffee_shop", "shaper", "beer"];

  categories.forEach((category) => {
    if (adsByCategory[category]?.length) {
      // Use the ad
      const ad = adsByCategory[category][0];
      items.push({
        type: category.replace("_", "") as
          | "surfCamp"
          | "coffeeShop"
          | "shaper"
          | "beer",
        name: ad.title || ad.companyName,
        url: ad.linkUrl,
        isAd: true,
        adId: ad.id,
      });
    } else {
      // Use regular listing if available
      switch (category) {
        case "coffee_shop":
          if (coffeeShops?.length) {
            items.push({
              type: "coffeeShop",
              name: coffeeShops[0].name,
            });
          }
          break;
        case "shaper":
          if (beach.shaper?.length) {
            items.push({
              type: "shaper",
              name: beach.shaper[0].name,
              url: beach.shaper[0].url,
            });
          }
          break;
        case "beer":
          if (beach.beer?.length) {
            items.push({
              type: "beer",
              name: beach.beer[0].name,
              url: beach.beer[0].url,
            });
          }
          break;
      }
    }
  });

  return { items };
}
