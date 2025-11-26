import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-lg dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏎️</span>
              <span className="text-xl font-bold">Luxury Rentals</span>
            </div>
            <div className="flex items-center gap-4">
              {session?.user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {session.user.email}
                  </span>
                  <Link href="/dashboard">
                    <Button variant="default">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <Link href="/auth/signin">
                  <Button variant="default">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Luxury Adventure
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Rentals
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Book premium supercars, yachts, jet-skis, and 4x4 campers for your next South African adventure.
            Experience luxury like never before.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/listings">
              <Button size="lg" className="text-base">
                Browse Rentals
              </Button>
            </Link>
            {!session?.user && (
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="text-base">
                  List Your Vehicle
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Supercars", emoji: "🏎️", count: "12 available" },
            { title: "Yachts", emoji: "⛵", count: "8 available" },
            { title: "Jet Skis", emoji: "🚤", count: "15 available" },
            { title: "4x4 Campers", emoji: "🚙", count: "6 available" },
          ].map((category) => (
            <div
              key={category.title}
              className="group relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:bg-slate-800"
            >
              <div className="absolute right-4 top-4 text-6xl opacity-10 transition-transform group-hover:scale-110">
                {category.emoji}
              </div>
              <div className="relative">
                <div className="mb-4 text-5xl">{category.emoji}</div>
                <h3 className="text-2xl font-semibold">{category.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {category.count}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold">Why Choose Us?</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "✨",
                title: "Premium Fleet",
                description: "Handpicked luxury vehicles maintained to perfection",
              },
              {
                icon: "🔒",
                title: "Secure Payments",
                description: "PayPal integration with buyer protection",
              },
              {
                icon: "🌤️",
                title: "Dynamic Pricing",
                description: "Weather-based pricing for the best deals",
              },
              {
                icon: "📍",
                title: "Delivery Available",
                description: "We bring the adventure to your doorstep",
              },
              {
                icon: "⚡",
                title: "Instant Booking",
                description: "Reserve your dream vehicle in minutes",
              },
              {
                icon: "🛡️",
                title: "Full Insurance",
                description: "Comprehensive coverage included",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-white p-6 dark:bg-slate-800"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold">Ready to Start Your Adventure?</h2>
          <p className="mt-4 text-lg opacity-90">
            Join thousands of satisfied customers who trust us with their luxury rentals
          </p>
          <div className="mt-8">
            <Link href={session?.user ? "/dashboard" : "/auth/signin"}>
              <Button size="lg" variant="secondary" className="text-base">
                {session?.user ? "Go to Dashboard" : "Get Started Now"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-lg dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Luxury Adventure Rentals. Built with Next.js 15 & Prisma.</p>
            <p className="mt-2">🇿🇦 Proudly serving South Africa</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

