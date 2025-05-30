import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { SurfSafariListing, SkillLevel } from '@prisma/client'
import { Dialog } from '@/app/components/ui/Dialog'
import { useToast } from '@/app/hooks/useToast'
import { Calendar } from '@/app/components/ui/Calendar'

interface BookSafariModalProps {
  safari: SurfSafariListing
  isOpen: boolean
  onClose: () => void
}

export default function BookSafariModal({ safari, isOpen, onClose }: BookSafariModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [date, setDate] = useState<Date>()
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.BEGINNER)
  const [bringingBoard, setBringingBoard] = useState(false)
  const [requiresRental, setRequiresRental] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id || !date) {
      toast({
        title: 'Error',
        description: 'Please sign in and select a date',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/bookings/safari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safariId: safari.id,
          userId: session.user.id,
          date,
          skillLevel,
          bringingBoard,
          requiresRental,
          notes
        })
      })

      if (!response.ok) throw new Error('Booking failed')

      toast({
        title: 'Success!',
        description: 'Your safari has been booked',
      })
      onClose()
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to book safari. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Header>
          <Dialog.Title>Book Surf Safari</Dialog.Title>
          <Dialog.Description>
            Book your spot with {safari.guide?.name}
          </Dialog.Description>
        </Dialog.Header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Skill Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Skill Level</label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
              className="w-full rounded-md border p-2"
            >
              {Object.values(SkillLevel).map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Board Options */}
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={bringingBoard}
                onChange={(e) => setBringingBoard(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>I'm bringing my own board</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={requiresRental}
                onChange={(e) => setRequiresRental(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>I need to rent a board</span>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border p-2"
              rows={3}
              placeholder="Any special requests or information..."
            />
          </div>

          <Dialog.Footer>
            <button
              type="submit"
              disabled={isSubmitting || !date}
              className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  )
}