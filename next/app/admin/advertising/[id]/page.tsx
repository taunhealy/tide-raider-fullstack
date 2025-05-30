'use client'

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function AdminReviewPage() {
  const { id } = useParams();
  const [reason, setReason] = useState('');

  const handleAction = async (action: 'approve' | 'reject') => {
    const response = await fetch(`/api/admin/advertising/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action,
        reason: action === 'reject' ? reason : undefined 
      })
    });

    if (response.ok) {
      window.location.href = '/admin/advertising';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Review Advertisement Request</h1>
      
      {/* Display ad details here */}

      <div className="space-y-4 mt-6">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason (if rejecting)"
          className="w-full p-2 border rounded"
          rows={3}
        />

        <div className="flex gap-4">
          <button
            onClick={() => handleAction('approve')}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction('reject')}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
} 