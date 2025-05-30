"use client";

import { useEffect } from "react";

interface TravelWidgetProps {
  title?: string;
  destinationCode?: string;
}

export default function TravelWidget({
  title = "Find Flights",
  destinationCode = "CPT", // Default to Cape Town
}: TravelWidgetProps) {
  useEffect(() => {
    // Create and inject the script
    const script = document.createElement("script");
    script.async = true;
    script.charset = "utf-8";

    // Construct widget URL with destination
    script.src = `https://tp.media/content?currency=usd&trs=383996&shmarker=601781&locale=en&default_destination=${destinationCode}&stops=any&show_hotels=true&powered_by=true&border_radius=0&plain=true&color_button=%2300A991&color_button_text=%23ffffff&promo_id=3414&campaign_id=111`;

    // Inject script
    const widgetContainer = document.getElementById("travel-widget");
    if (widgetContainer) {
      widgetContainer.innerHTML = "";
      widgetContainer.appendChild(script);
    }

    return () => {
      script.remove();
    };
  }, [destinationCode]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div id="travel-widget" className="min-h-[300px]"></div>
    </div>
  );
}
