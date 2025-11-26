export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-primary text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Luxury Adventure Rentals
        </h1>
        <p className="text-center text-muted-foreground mb-12">
          Book premium supercars, yachts, jet-skis, and 4x4 campers for your next South African adventure.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Supercars", emoji: "🏎️" },
            { title: "Yachts", emoji: "⛵" },
            { title: "Jet Skis", emoji: "🚤" },
            { title: "4x4 Campers", emoji: "🚙" },
          ].map((category) => (
            <div
              key={category.title}
              className="p-6 border border-border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4 text-center">{category.emoji}</div>
              <h3 className="text-xl font-semibold text-center">{category.title}</h3>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            🚀 Foundation ready. Implement routes and features next.
          </p>
        </div>
      </div>
    </main>
  );
}

