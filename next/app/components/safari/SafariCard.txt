import { useState } from 'react'
import Image from 'next/image'
import { SurfSafariListing, User, Review } from '@prisma/client'
import { WindData } from '@/app/types/wind'
import { formatCurrency } from '@/app/lib/utils'
import { Star, MapPin, Car } from 'lucide-react'
import BookSafariModal from './BookSafariModal'

interface SafariCardProps {
  safari: SurfSafariListing & {
    guide: User;
    reviews: Review[];
    beaches: { beach: { name: string } }[];
  }
  windData: WindData | null
}

export default function SafariCard({ safari, windData }: SafariCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const averageRating = safari.reviews.length > 0
    ? safari.reviews.reduce((acc, review) => acc + review.rating, 0) / safari.reviews.length
    : null

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <div className="relative h-48">
        {safari.profileImage ? (
          <Image
            src={safari.profileImage}
            alt={safari.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">{safari.title}</h3>
          <div className="flex items-center">
            {averageRating && (
              <>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1">{averageRating.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{safari.location}</span>
        </div>

        {/* Transport */}
        {safari.hasVehicleTransport && (
          <div className="flex items-center text-gray-600 mb-4">
            <Car className="w-4 h-4 mr-2" />
            <span>Transport included</span>
          </div>
        )}

        {/* Beaches */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Surf Spots:</h4>
          <div className="flex flex-wrap gap-2">
            {safari.beaches.map(({ beach }) => (
              <span 
                key={beach.name}
                className="bg-gray-100 px-2 py-1 rounded-full text-sm"
              >
                {beach.name}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Book Button */}
        <div className="flex justify-between items-center mt-6">
          <div>
            {safari.isFree ? (
              <span className="text-green-600 font-medium">Free</span>
            ) : (
              <span className="text-lg font-medium">
                {formatCurrency(safari.price || 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors duration-300"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <BookSafariModal
        safari={safari}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}