import { useState, useEffect } from "react"
import { useSubscription } from "@/app/context/SubscriptionContext"
import { WindData } from "@/app/types/wind"
import prisma from "@/app/lib/prisma"
import SafariCard from "@/app/components/safari/SafariCard"
import SafariFilter from "@/app/components/safari/SafariFilter"
import { SurfSafariListing } from "@prisma/client"

interface SafariContainerProps {
  windData: WindData | null
}

export default function SafariContainer({ windData }: SafariContainerProps) {
  const { isSubscribed } = useSubscription()
  const [safaris, setSafaris] = useState<SurfSafariListing[]>([])
  const [filteredSafaris, setFilteredSafaris] = useState<SurfSafariListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    region: [],
    priceRange: [0, 1000],
    hasTransport: false,
  })

  useEffect(() => {
    async function fetchSafaris() {
      const response = await fetch('/api/safaris')
      const data = await response.json()
      setSafaris(data)
      setFilteredSafaris(data)
      setIsLoading(false)
    }
    fetchSafaris()
  }, [])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    
    const filtered = safaris.filter(safari => {
      const matchesRegion = newFilters.region.length === 0 || 
        newFilters.region.includes(safari.region)
      const matchesPrice = safari.price >= newFilters.priceRange[0] && 
        safari.price <= newFilters.priceRange[1]
      const matchesTransport = !newFilters.hasTransport || 
        safari.hasVehicleTransport

      return matchesRegion && matchesPrice && matchesTransport
    })

    setFilteredSafaris(filtered)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
      <SafariFilter 
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSafaris.map(safari => (
          <SafariCard 
            key={safari.id}
            safari={safari}
            windData={windData}
          />
        ))}
      </div>
    </div>
  )
} 