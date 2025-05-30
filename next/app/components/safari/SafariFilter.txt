import { Region } from '@prisma/client'
import { Slider } from '@/app/components/ui/Slider'

interface SafariFilterProps {
  filters: {
    region: Region[]
    priceRange: [number, number]
    hasTransport: boolean
  }
  onFilterChange: (filters: SafariFilterProps['filters']) => void
}

export default function SafariFilter({ filters, onFilterChange }: SafariFilterProps) {
  const regions = Object.values(Region)

  const handleRegionChange = (region: Region) => {
    const newRegions = filters.region.includes(region)
      ? filters.region.filter(r => r !== region)
      : [...filters.region, region]
    
    onFilterChange({
      ...filters,
      region: newRegions
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-6">Filters</h2>

      {/* Region Filter */}
      <div className="mb-8">
        <h3 className="font-medium mb-3">Region</h3>
        <div className="space-y-2">
          {regions.map(region => (
            <label key={region} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.region.includes(region)}
                onChange={() => handleRegionChange(region)}
                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="ml-2">{region.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-8">
        <h3 className="font-medium mb-3">Price Range</h3>
        <Slider
          min={0}
          max={2000}
          step={100}
          value={filters.priceRange}
          onChange={(value) => onFilterChange({
            ...filters,
            priceRange: value as [number, number]
          })}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>R{filters.priceRange[0]}</span>
          <span>R{filters.priceRange[1]}</span>
        </div>
      </div>

      {/* Transport Filter */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.hasTransport}
            onChange={(e) => onFilterChange({
              ...filters,
              hasTransport: e.target.checked
            })}
            className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span className="ml-2">Has Transport</span>
        </label>
      </div>
    </div>
  )
}