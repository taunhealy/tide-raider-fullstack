import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import type { RentalRequestWithRelations } from "@/app/types/rentals";

interface RequestDetailsProps {
  request: RentalRequestWithRelations | null;
}

export function RequestDetails({ request }: RequestDetailsProps) {
  if (!request) return null;

  // Calculate rental duration in days
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 my-4 font-primary">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Item Image */}
        <div className="w-full md:w-1/3">
          {request.rentalItem?.thumbnail ? (
            <div className="relative h-48 w-full rounded-lg overflow-hidden">
              <Image
                src={request.rentalItem.thumbnail}
                alt={request.rentalItem?.name || "Rental Item"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-48 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </div>

        {/* Request Details */}
        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-semibold mb-4">
            {request.rentalItem?.name || "Rental Request"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Rental Period
              </h3>
              <p>
                {format(new Date(request.startDate), "MMM d, yyyy")} -
                {format(new Date(request.endDate), "MMM d, yyyy")}
                <span className="ml-1 text-sm text-gray-500">
                  ({durationDays} {durationDays === 1 ? "day" : "days"})
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
              <p>
                {request.totalCost ? (
                  <>
                    $
                    {(typeof request.totalCost === "string"
                      ? JSON.parse(request.totalCost)
                      : request.totalCost
                    )?.usd || 0}{" "}
                    USD
                  </>
                ) : (
                  <>$0 USD</>
                )}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Owner</h3>
              <div className="flex items-center mt-1">
                {request.owner?.image ? (
                  <Image
                    src={request.owner.image}
                    alt={request.owner.name}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                )}
                <span>{request.owner?.name}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Renter</h3>
              <div className="flex items-center mt-1">
                {request.renter?.image ? (
                  <Image
                    src={request.renter.image}
                    alt={request.renter.name}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                )}
                <span>{request.renter?.name}</span>
              </div>
            </div>

            {/* Add expiration info for pending requests */}
            {request.status === "PENDING" && request.expiresAt && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Request Expires
                </h3>
                <p className="text-amber-600">
                  {format(
                    new Date(request.expiresAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </p>
              </div>
            )}
          </div>

          {request.cancellationReason && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">
                Cancellation Reason
              </h3>
              <p className="text-red-600">{request.cancellationReason}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/rentals/${request.rentalItemId}`}
              className="text-black hover:underline font-primary"
            >
              View Rental Item Details
            </Link>

            {/* Add a link to view the beach if available */}
            {request.beachId && (
              <Link
                href={`/beaches/${request.beachId}`}
                className="text-black-600 hover:underline font-primary"
              >
                View Beach Location
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
