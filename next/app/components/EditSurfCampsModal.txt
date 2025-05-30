'use client'

import { useState } from 'react'
import { SurfCamp } from '@/app/types/surfcamp'
import { Dialog } from '@headlessui/react'

interface EditSurfCampModalProps {
  surfCamp: SurfCamp
  isOpen: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (updatedCamp: SurfCamp) => void
}

export function EditSurfCampModal({
  surfCamp,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
}: EditSurfCampModalProps) {
  const [formData, setFormData] = useState({
    name: surfCamp.name,
    location: surfCamp.location,
    websiteUrl: surfCamp.websiteUrl,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/surfcamps/${surfCamp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update surf camp')

      const updatedCamp = await response.json()
      onUpdate(updatedCamp)
      onClose()
    } catch (error) {
      console.error('Error updating surf camp:', error)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Edit Surf Camp
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="modal-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="modal-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website URL
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="modal-input"
                required
              />
            </div>

            <div className="flex justify-between gap-4 mt-6">
              <button
                type="button"
                onClick={() => onDelete(surfCamp.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tertiary px-4 py-2"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}