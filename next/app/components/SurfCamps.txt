'use client'

import { useState } from 'react'
import { SurfCamp } from '@/app/types/surfcamp'
import Image from 'next/image'
import Link from 'next/link'
import { EditSurfCampModal } from './EditSurfCampModal'

interface SurfCampsProps {
  surfCamps: SurfCamp[]
  isOrganizer: boolean
  userId?: string
}

export default function SurfCamps({ surfCamps, isOrganizer, userId }: SurfCampsProps) {
  const [camps, setCamps] = useState<SurfCamp[]>(surfCamps)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCamp, setSelectedCamp] = useState<SurfCamp | null>(null)

  const handleDelete = async (campId: string) => {
    try {
      const response = await fetch(`/api/surfcamps/${campId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete surf camp')

      setCamps(camps.filter(camp => camp.id !== campId))
    } catch (error) {
      console.error('Error deleting surf camp:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {camps.map((camp) => (
        <div key={camp.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <Link href={camp.websiteUrl} target="_blank" rel="noopener noreferrer">
            <div className="relative h-48 w-full">
              <Image
                src={camp.imageUrl}
                alt={camp.name}
                fill
                className="object-cover"
              />
            </div>
          </Link>
          
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">{camp.name}</h3>
            <p className="text-gray-600 mb-4">{camp.location}</p>
            
            {isOrganizer && camp.userId === userId && (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedCamp(camp)
                    setIsEditModalOpen(true)
                  }}
                  className="btn-tertiary px-4 py-2"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {isEditModalOpen && selectedCamp && (
        <EditSurfCampModal
          surfCamp={selectedCamp}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedCamp(null)
          }}
          onDelete={handleDelete}
          onUpdate={(updatedCamp) => {
            setCamps(camps.map(camp => 
              camp.id === updatedCamp.id ? updatedCamp : camp
            ))
          }}
        />
      )}
    </div>
  )
}