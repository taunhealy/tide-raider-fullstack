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
  shaper?: { name: string; url?: string }[];
  beer?: { name: string; url?: string }[];
  region: string;
}

export function getMediaGridItems(
  videos: MediaItem[] = [],
  coffeeShops: CoffeeShop[] = [],
  beach: Beach
) {
  const items = [];

  // Add videos first
  if (videos?.length) {
    items.push(
      ...videos.map((video) => ({
        type: "video",
        ...video,
      }))
    );
  }

  // Add services (ads removed)
  const categories = ["coffee_shop", "shaper", "beer"];

  categories.forEach((category) => {
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
  });

  return { items };
}
