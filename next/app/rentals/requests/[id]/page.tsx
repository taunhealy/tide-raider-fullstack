import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { RentalRequestActions } from "@/app/components/rentals/RentalRequestActions";
import { RentalRequestChat } from "@/app/components/rentals/RentalRequestChat";
import { RentalRequestWithRelations } from "@/app/types/rentals";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const request = await prisma.rentalItemRequest.findUnique({
    where: { id: params.id },
    select: {
      rentalItem: {
        select: { name: true },
      },
    },
  });

  if (!request) {
    return {
      title: "Request Not Found | Surf Safari",
    };
  }

  return {
    title: `Rental Request: ${request.rentalItem.name} | Surf Safari`,
    description: "Manage your rental request",
  };
}

export default async function RentalRequestPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/rentals/requests/${params.id}`);
  }

  // Fetch the rental request
  const request = (await prisma.rentalItemRequest.findUnique({
    where: { id: params.id },
    include: {
      rentalItem: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      },
      renter: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
      beach: {
        select: {
          id: true,
          name: true,
          region: {
            select: {
              name: true,
            },
          },
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })) as unknown as RentalRequestWithRelations;

  if (!request) {
    return notFound();
  }

  // Check if user is authorized to view this request
  if (
    request.renterId !== session.user.id &&
    request.ownerId !== session.user.id
  ) {
    redirect("/rentals/requests");
  }

  // Calculate rental duration in days
  const days = Math.ceil(
    (new Date(request.endDate).getTime() -
      new Date(request.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Format the status for display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded">
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
            Cancelled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
            Completed
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
            {status}
          </span>
        );
    }
  };

  const isRenter = request.renterId === session.user.id;

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="mb-6">
        <Link
          href="/rentals/requests"
          className="text-blue-600 hover:underline flex items-center"
        >
          ← Back to Requests
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold">Rental Request</h1>
              {getStatusBadge(request.status)}
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative h-16 w-16 bg-gray-100 rounded overflow-hidden">
                {request.rentalItem.thumbnail ? (
                  <Image
                    src={`https://imagedelivery.net/your-account-hash/${request.rentalItem.thumbnail}/public`}
                    alt={request.rentalItem.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <span className="text-xs text-gray-400">No image</span>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  {request.rentalItem.name}
                </h2>
                <p className="text-gray-600">{request.rentalItem.itemType}</p>
                <Link
                  href={`/rentals/${request.rentalItem.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Item Details
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-2">Rental Details</h3>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-600">Dates:</span>{" "}
                    {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(request.endDate), "MMM d, yyyy")}
                  </p>
                  <p>
                    <span className="text-gray-600">Duration:</span> {days} day
                    {days !== 1 ? "s" : ""}
                  </p>
                  <p>
                    <span className="text-gray-600">Pickup/Dropoff:</span>{" "}
                    {request.beach.name}
                  </p>
                  <p>
                    <span className="text-gray-600">Total Cost:</span> R
                    {request.totalCost.zar}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">
                  {isRenter ? "Owner" : "Renter"} Information
                </h3>
                <div className="flex items-center space-x-3 mb-3">
                  {(isRenter ? request.owner : request.renter).image && (
                    <Image
                      src={(isRenter ? request.owner : request.renter).image!}
                      alt={(isRenter ? request.owner : request.renter).name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {(isRenter ? request.owner : request.renter).name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Actions */}
            <RentalRequestActions
              requestId={request.id}
              status={request.status}
              isRenter={isRenter}
            />
          </div>

          {/* Chat Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <RentalRequestChat
              requestId={request.id}
              messages={request.messages}
              currentUserId={session.user.id}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Request Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className="bg-black rounded-full h-4 w-4"></div>
                  <div className="h-full w-0.5 bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-medium">Request Created</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(request.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>

              {request.status !== "PENDING" && (
                <div className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`rounded-full h-4 w-4 ${
                        request.status === "APPROVED"
                          ? "bg-green-500"
                          : request.status === "REJECTED"
                            ? "bg-red-500"
                            : request.status === "CANCELLED"
                              ? "bg-gray-500"
                              : "bg-black"
                      }`}
                    ></div>
                    <div className="h-full w-0.5 bg-gray-200"></div>
                  </div>
                  <div>
                    <p className="font-medium">
                      Request{" "}
                      {request.status === "APPROVED"
                        ? "Approved"
                        : request.status === "REJECTED"
                          ? "Rejected"
                          : request.status === "CANCELLED"
                            ? "Cancelled"
                            : request.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(
                        new Date(request.updatedAt),
                        "MMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              )}

              {request.status === "APPROVED" && (
                <>
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className="bg-gray-300 rounded-full h-4 w-4"></div>
                      <div className="h-full w-0.5 bg-gray-200"></div>
                    </div>
                    <div>
                      <p className="font-medium">Pickup Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(request.startDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className="bg-gray-300 rounded-full h-4 w-4"></div>
                    </div>
                    <div>
                      <p className="font-medium">Return Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <p className="mb-4">
              If you have any issues with this rental, please contact our
              support team.
            </p>
            <Link href="/contact" className="btn-primary w-full text-center">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
