"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface RentalRequest {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalCost: any;
  createdAt: string;
  updatedAt: string;
  rentalItem: {
    id: string;
    name: string;
    thumbnail: string | null;
    itemType: string;
  };
  renter: {
    id: string;
    name: string;
    image: string | null;
  };
  owner: {
    id: string;
    name: string;
    image: string | null;
  };
  beach: {
    id: string;
    name: string;
  };
}

interface RentalRequestsListProps {
  requests: RentalRequest[];
  currentUserId: string;
}

export function RentalRequestsList({
  requests,
  currentUserId,
}: RentalRequestsListProps) {
  // Format the status for display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Cancelled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="bg-blue-100 text-black text-xs font-medium px-2.5 py-0.5 rounded">
            Completed
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isRenter = request.renter.id === currentUserId;
        const otherParty = isRenter ? request.owner : request.renter;

        return (
          <Link key={request.id} href={`/rentals/requests/${request.id}`}>
            <div className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative h-12 w-12 bg-gray-100 rounded overflow-hidden">
                    {request.rentalItem.thumbnail ? (
                      <Image
                        src={`https://imagedelivery.net/your-account-hash/${request.rentalItem.thumbnail}/public`}
                        alt={request.rentalItem.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-200">
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{request.rentalItem.name}</h3>
                    <p className="text-sm text-gray-600">
                      {request.rentalItem.itemType}
                    </p>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dates</p>
                  <p className="text-sm">
                    {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(request.endDate), "MMM d, yyyy")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-sm">{request.beach.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-sm font-medium">
                    R{request.totalCost.zar}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {otherParty.image && (
                    <Image
                      src={otherParty.image}
                      alt={otherParty.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-600">
                    {isRenter ? "Owner:" : "Renter:"} {otherParty.name}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  Updated {format(new Date(request.updatedAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
