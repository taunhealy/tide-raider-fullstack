import Navbar from "@/app/components/Navbar";
import BlogForecastWidget from "@/app/components/forecast/BlogForecastWidget";
import { Button } from "@/app/components/ui/Button";

export const metadata = {
  title: "The Glide: 30+ Best Longboarding Spots in the World | Tide Raider",
  description: "Experience the ultimate noseriding pilgrimage. A definitive guide to 30+ most iconic longboarding surf spots across the globe.",
};

const spots = [
  {
    name: "Waikiki - Queens",
    location: "Oahu, Hawaii",
    country: "USA",
    countryCode: "US",
    description: "The birthplace of modern surfing and the absolute Mecca for longboarding. Queens offers a perfectly peeling right-hander over a mellow reef. It's not just a surf spot; it's a piece of history where the spirit of Aloha was defined.",
    videoUrl: "https://www.youtube.com/embed/RzrdUuX6vUc",
    highlight: "Historical Birthplace"
  },
  {
    name: "San Onofre - Old Man's",
    location: "California, USA",
    country: "USA",
    countryCode: "US",
    description: "Often called the 'Cathedral of Longboarding,' San Onofre is all about the community and the slow, mellow roll. The waves here are gentle, consistent, and seemingly designed for cross-stepping.",
    videoUrl: "https://www.youtube.com/embed/LA1mB_N_gWU",
    highlight: "The Cathedral"
  },
  {
    name: "The Pass, Byron Bay",
    location: "New South Wales, Australia",
    country: "Australia",
    countryCode: "AU",
    description: "A world-standard right-hand point break that can provide rides for hundreds of meters. The Pass is a true noserider's paradise, offering long, mechanical walls that allow for multiple turns.",
    videoUrl: "https://www.youtube.com/embed/AFEjjIEPjgk",
    highlight: "Endless Right"
  },
  {
    name: "Chicama - El Point",
    location: "La Libertad, Peru",
    country: "Peru",
    countryCode: "PE",
    description: "Legendary for being the longest left-hand wave in the world. On a solid swell, you can ride for over a kilometer. Multiple sections offer incredible variety for longboarding.",
    videoUrl: "https://www.youtube.com/embed/gvBC71MYGq4",
    highlight: "World's Longest Left"
  },
  {
    name: "Noosa - First Point",
    location: "Queensland, Australia",
    country: "Australia",
    countryCode: "AU",
    description: "Noosa is the high-performance capital of longboarding. First Point provides a flawless right-hand wrap around the headland inside the National Park. Protected from the wind and aesthetically perfect.",
    videoUrl: "https://www.youtube.com/embed/kpLvjor3Wpg",
    highlight: "Style Capital"
  },
  {
    name: "Malibu - First Point",
    location: "California, USA",
    country: "USA",
    countryCode: "US",
    description: "The 'quintessential' longboarding wave. Malibu's First Point is the world standard for styling on a longboard. A perfect, peeling right-hand point break that defined California surfing culture.",
    videoUrl: "https://www.youtube.com/embed/bK38DSfXFBc",
    highlight: "Gidget's Playground"
  },
  {
    name: "Saladita",
    location: "Guerrero, Mexico",
    country: "Mexico",
    countryCode: "MX",
    description: "Known as the Chicama of Mexico, Saladita is a world-class longboarding machine. This peeling left-hand point break offers rides that continue for several hundred yards over a mellow cobblestone reef.",
    videoUrl: "https://www.youtube.com/embed/GQ5vJARj0p8",
    highlight: "Mexico's Chicama"
  },
  {
    name: "Scorpion Bay",
    location: "San Juanico, Mexico",
    country: "Mexico",
    countryCode: "MX",
    description: "A legendary series of right-hand points in Baja California. Scorpion Bay offers some of the longest waves in the world, with multiple points that can connect on a large swell for marathon rides.",
    videoUrl: "https://www.youtube.com/embed/oMu93NtJqy0",
    highlight: "The Long Road"
  },
  {
    name: "Côte des Basques",
    location: "Biarritz, France",
    country: "France",
    countryCode: "FR",
    description: "The historical heart of European surfing. Côte des Basques offers long, elegant waves beneath the impressive Villa Belza. It is a premier destination for traditional logging in Europe.",
    videoUrl: "https://www.youtube.com/embed/lK2-wiGrhUg",
    highlight: "European Soul"
  },
  {
    name: "Somo Beach",
    location: "Cantabria, Spain",
    country: "Spain",
    countryCode: "ES",
    description: "A reliable and consistent beach break in Northern Spain. Somo features a lively skate and surf culture, with gentle, rolling peaks that are perfect for longboarding all year round.",
    videoUrl: "https://www.youtube.com/embed/F0vjr00cToY",
    highlight: "Spanish Classic"
  },
  {
    name: "Saunton Sands",
    location: "Devon, UK",
    country: "United Kingdom",
    countryCode: "GB",
    description: "Britain's premier longboarding beach. Known for its massive expanse and slow-breaking rollers that provide hundreds of meters of rideable face. Ideal for traditional logging in the Atlantic.",
    videoUrl: "https://www.youtube.com/embed/s5t-yL2Wk4Y",
    highlight: "Atlantic Log"
  },
  {
    name: "Lazy Left",
    location: "Midigama, Sri Lanka",
    country: "Sri Lanka",
    countryCode: "LK",
    description: "A long, rolling left-hand point break that is a favorite in Sri Lanka. It offers a mellow ride that can go for 200+ meters, making it perfect for noseriding in tropical water.",
    videoUrl: "https://www.youtube.com/embed/_8-IpK5J9wk",
    highlight: "Tropical Soul"
  },
  {
    name: "Gas Stations",
    location: "Midigama, Sri Lanka",
    country: "Sri Lanka",
    countryCode: "LK",
    description: "A playful, consistent left-hand peak located right in front of a local landmark. Excellent for those looking to practice their cross-stepping on a predictable, easy-to-read wall.",
    videoUrl: "https://www.youtube.com/embed/pJI1KIsI7N0",
    highlight: "The Local Spot"
  },
  {
    name: "Batu Karas",
    location: "West Java, Indonesia",
    country: "Indonesia",
    countryCode: "ID",
    description: "Often called the home of longboarding in Indonesia. Batu Karas is a sheltered point break offering mechanical, slow-breaking right-handers over a safe sand bottom.",
    videoUrl: "https://www.youtube.com/embed/uooRe3xANQo",
    highlight: "Javanese Glide"
  },
  {
    name: "Sire Beach",
    location: "Lombok, Indonesia",
    country: "Indonesia",
    countryCode: "ID",
    description: "A hidden gem on Lombok's northern coast. Offers very long, gentle walls over a safe sand and reef bottom, often known for its 'party wave' atmosphere and relaxed vibe.",
    videoUrl: "https://www.youtube.com/embed/auIY60jJmJY",
    highlight: "Hidden Lombok"
  },
  {
    name: "Imsouane",
    location: "Souss-Massa, Morocco",
    country: "Morocco",
    countryCode: "MA",
    description: "The Magic Bay in Imsouane is legendary in the longboarding world. It offers a right-hand wave that can peel for over 600 meters in a deep, protected bay. The wave is famously slow and easy to ride, making it the ultimate destination for traditional logging in Morocco.",
    videoUrl: "https://www.youtube.com/embed/FjIu0Z5tK3A",
    highlight: "Moroccan Magic"
  },
  {
    name: "NGor Island",
    location: "Dakar, Senegal",
    country: "Senegal",
    countryCode: "SN",
    description: "Featured in 'The Endless Summer', NGor Island is Senegal's most famous wave. It's a high-quality right-hand reef break that offers long, consistent sections perfect for longboarding. The island atmosphere and clear water make it a unique West African destination.",
    videoUrl: "https://www.youtube.com/embed/5rLzW8x9Z0E",
    highlight: "Senegal Classic"
  },
  {
    name: "Mahambo",
    location: "East Coast, Madagascar",
    country: "Madagascar",
    countryCode: "MG",
    description: "The surfing capital of Madagascar's East Coast. It features a very long, rolling reef break that is perfect for longboarders. The waves break in warm, turquoise water surrounded by lush tropical vegetation.",
    videoUrl: "https://www.youtube.com/embed/kYJ_Z4C_XkU",
    highlight: "Madagascar Glide"
  },
  {
    name: "Muizenberg Beach",
    location: "Cape Town, South Africa",
    country: "South Africa",
    countryCode: "ZA",
    description: "The heart of South African longboarding. Famous for its long, gentle rollers and colorful beach huts. It offers some of the cleanest, longest rides in Africa.",
    videoUrl: "https://www.youtube.com/embed/5J5pHuZqO60",
    highlight: "The Corner"
  },
  {
    name: "Ahipara (Shipwrecks)",
    location: "Northland, New Zealand",
    country: "New Zealand",
    countryCode: "NZ",
    description: "One of the world's most famous left-hand point breaks. Ahipara offers incredibly long, peeling walls that wrap around the point for hundreds of meters. A dream for any longboarder.",
    videoUrl: "https://www.youtube.com/embed/0kaD38yYlmg",
    highlight: "Kiwi Classic"
  },
  {
    name: "Namotu Lefts",
    location: "Namotu Island, Fiji",
    country: "Fiji",
    countryCode: "FJ",
    description: "A world-class longboarding peak that offers high-quality walls in perfectly clear, tropical water. On moderate swells, it is one of the most aesthetic rides in the South Pacific.",
    videoUrl: "https://www.youtube.com/embed/AYIZ6G2OEh0",
    highlight: "Fijian Paradise"
  },
  {
    name: "Jericoacoara",
    location: "Ceará, Brazil",
    country: "Brazil",
    countryCode: "BR",
    description: "Renowned for its glassy, slow-breaking waves. The point break at the base of the massive sand dunes provides incredibly consistent, peeling waves ideal for traditional style.",
    videoUrl: "https://www.youtube.com/embed/9E6ZTL-VI6g",
    highlight: "Dune Glide"
  },
  {
    name: "Jeju Island (Jungmun)",
    location: "Jeju, South Korea",
    country: "South Korea",
    countryCode: "KR",
    description: "The birthplace of Korean surfing. Jungmun Saekdal Beach provides fun, crumbly peaks that are perfect for longboarding amidst a unique volcanic landscape.",
    videoUrl: "https://www.youtube.com/embed/uK1JbN267p8",
    highlight: "Korean Wave"
  },
  {
    name: "Playa Guiones",
    location: "Nosara, Costa Rica",
    country: "Costa Rica",
    countryCode: "CR",
    description: "The perfect beach break for longboarding. Captures almost any swell and provides consistent, crumbling walls that go on for ages in warm Pura Vida water.",
    videoUrl: "https://www.youtube.com/embed/Y3-JqSWlS2U",
    highlight: "Pura Vida Log"
  },
  {
    name: "Boca Barranca",
    location: "Puntarenas, Costa Rica",
    country: "Costa Rica",
    countryCode: "CR",
    description: "One of the longest lefts in the world. A river mouth point break that can peel for over 500 meters, offering a marathon ride for those with the stamina.",
    videoUrl: "https://www.youtube.com/embed/FzH7_p7XwRI",
    highlight: "Marathon Left"
  },
  {
    name: "Maria's",
    location: "Rincon, Puerto Rico",
    country: "Puerto Rico",
    countryCode: "PR",
    description: "A playful, multi-section right-hand reef break that is a longboarding staple in the Caribbean. Famous for its warm water and multiple takeoff zones.",
    videoUrl: "https://www.youtube.com/embed/iU2KKyAZo_E",
    highlight: "Caribbean Queen"
  },
  {
    name: "Freights Bay",
    location: "Christ Church, Barbados",
    country: "Barbados",
    countryCode: "BB",
    description: "Often called the best longboarding spot in the Caribbean. A mellow, long left-hand point break that offers gentle walls over a safe sand and reef bottom.",
    videoUrl: "https://www.youtube.com/embed/Ibw1OuBsQAw",
    highlight: "Island Glide"
  },
  {
    name: "Mizata",
    location: "La Libertad, El Salvador",
    country: "El Salvador",
    countryCode: "SV",
    description: "A secluded right-hand point break that offers a much more relaxed pace than the busier breaks nearby. Perfect for traditional longboarding and aesthetic lines.",
    videoUrl: "https://www.youtube.com/embed/3Wn719iO7Zg",
    highlight: "Hidden Point"
  },
  {
    name: "Popoyo",
    location: "Rivas, Nicaragua",
    country: "Nicaragua",
    countryCode: "NI",
    description: "Nicaragua's consistency king. On mellower days, the outer peak provides incredible, long walls for longboarding under perpetual offshore winds.",
    videoUrl: "https://www.youtube.com/embed/v0L1h-Y7K0o",
    highlight: "Offshore Mecca"
  },
  {
    name: "Bocas Del Toro (Carenero)",
    location: "Bocas, Panama",
    country: "Panama",
    countryCode: "PA",
    description: "A stunning Caribbean point break. Carenero offers long, peeling lefts in crystal clear water, often providing glassy conditions perfect for longboarding.",
    videoUrl: "https://www.youtube.com/embed/z3m-uQz6I_0",
    highlight: "Tropical Peak"
  },
  {
    name: "La Punta",
    location: "Puerto Escondido, Mexico",
    country: "Mexico",
    countryCode: "MX",
    description: "The softer, more refined alternative to Zicatela. A long, peeling left-hand point break that provides excellent sections for style and noseriding.",
    videoUrl: "https://www.youtube.com/embed/_PVGlKyABOM",
    highlight: "Sunset Log"
  },
  {
    name: "Nine Palms",
    location: "East Cape, Mexico",
    country: "Mexico",
    countryCode: "MX",
    description: "A classic Baja right-hand point break. Known for consistent, slow-breaking waves that provide excellent runway for noseriding in the desert heat.",
    videoUrl: "https://www.youtube.com/embed/CwiGFOQtAjc",
    highlight: "Desert Right"
  },
  {
    name: "Salina Cruz (Punta Conejo)",
    location: "Oaxaca, Mexico",
    country: "Mexico",
    countryCode: "MX",
    description: "A series of sand-bottomed right-hand points. Offers incredibly long, workable walls that are a dream for longboarding on moderate swells.",
    videoUrl: "https://www.youtube.com/embed/DXV29AEUilA",
    highlight: "Oaxacan Right"
  },
  {
    name: "Punta Mita (Anclote)",
    location: "Nayarit, Mexico",
    country: "Mexico",
    countryCode: "MX",
    description: "Often called 'The Waikiki of Mexico'. A very mellow, slow-breaking reef peak that is perfect for learning and traditional logging.",
    videoUrl: "https://www.youtube.com/embed/QATjKGzHJOw",
    highlight: "Tropical Mellow"
  }
];

export default function LongboardingBlogPost() {
  return (
    <div className="bg-white min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/blog/longboarding-ghibli-thumbnail.png" 
            alt="Longboarding Hero" 
            className="w-full h-full object-cover brightness-[0.7]"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gray-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6 animate-fade-in border border-white/10 shadow-xl">
            Global Guide
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white font-primary mb-6 drop-shadow-2xl">
            The Glide: Top 30 Longboarding Spots in the World
          </h1>
          <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
             The definitive pilgrimage map for the traditionalist. From the historic rollers of Hawaii to the endless points of Mexico and Indonesia.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="prose prose-lg max-w-none mb-16">
          <p className="text-gray-700 leading-relaxed font-medium text-xl italic border-l-4 border-gray-200 pl-6 mb-12">
            "While shortboarding captures the adrenaline, longboarding captures the soul. It's about flow, trim, and finding the perfect 'pocket' where the board feels weightless."
          </p>
          <p className="text-gray-700 leading-relaxed">
            To truly experience the magic of logging, you need the right canvas. The world is full of waves, but only a few possess that specific mechanical perfection required for the longboarders' dance. We've curated the top 30+ destinations where the glide is guaranteed.
          </p>
        </div>

        {/* Spots Loop */}
        <div className="space-y-32">
          {spots.map((spot, index) => (
            <article key={spot.name} className="group">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-6xl font-bold text-blue-100 font-primary tabular-nums">{(index + 1).toString().padStart(2, '0')}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{spot.highlight}</span>
                    <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">
                      <img 
                        src={`https://flagcdn.com/w20/${spot.countryCode.toLowerCase()}.png`} 
                        alt={spot.country}
                        className="w-4 h-auto rounded-sm"
                      />
                      {spot.country.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 font-primary">{spot.name}</h2>
                </div>
              </div>

              <div className="prose prose-lg max-w-none text-gray-700 mb-8">
                <p>{spot.description}</p>
              </div>

              {/* YouTube Embed */}
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl mb-8 group-hover:scale-[1.01] transition-transform duration-500 bg-gray-100">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src={spot.videoUrl.replace('watch?v=', 'embed/')}
                  title={spot.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Spot Forecast Widget */}
              <BlogForecastWidget beachName={spot.name.includes(' - ') ? spot.name.split(' - ')[0] : spot.name.includes(' (') ? spot.name.split(' (')[0] : spot.name} />

              <div className="w-full h-px bg-gray-100 mt-20"></div>
            </article>
          ))}
        </div>

        {/* Conclusion */}
        <section className="mt-32 p-12 bg-gray-900 rounded-[3rem] text-center text-white">
          <h2 className="text-4xl font-bold font-primary mb-6">The Endless Summer Awaits</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Stay ahead of the swell. Tide Raider provides real-time analytics and alerts for every iconic spot on this list.
          </p>
          <Button 
            className="bg-gray-100 text-black hover:bg-gray-200 rounded-full font-bold h-14 px-10 border-none shadow-xl"
            size="lg"
          >
            Start Your Free Trial
          </Button>
        </section>
      </main>

      {/* Footer Disclaimer */}
      <footer className="py-12 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
          &copy; 2024 Tide Raider Global Surf Intel. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
