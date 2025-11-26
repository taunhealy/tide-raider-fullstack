import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <nav className="border-b bg-white/50 backdrop-blur-lg dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold">Luxury Rentals Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session?.user?.email}
              </span>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Welcome back, {session?.user?.name}!
          </h2>
          <p className="mt-2 text-muted-foreground">
            Manage your luxury adventure rental business
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Listings",
              description: "Manage your rental inventory",
              icon: "🚗",
              href: "/dashboard/listings",
            },
            {
              title: "Bookings",
              description: "View and manage reservations",
              icon: "📅",
              href: "/dashboard/bookings",
            },
            {
              title: "Settings",
              description: "Configure PayPal & preferences",
              icon: "⚙️",
              href: "/dashboard/settings",
            },
          ].map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="group rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:bg-slate-800"
            >
              <div className="mb-4 text-4xl">{card.icon}</div>
              <h3 className="text-xl font-semibold group-hover:text-primary">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.description}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold">Quick Stats</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="mt-1 text-2xl font-bold">0</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-muted-foreground">Pending Bookings</p>
              <p className="mt-1 text-2xl font-bold">0</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold">R 0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
