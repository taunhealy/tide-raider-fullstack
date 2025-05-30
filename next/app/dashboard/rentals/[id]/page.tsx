import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { RentalItemForm } from "@/app/components/rentals/RentalItemForm";
import { DeleteRentalItemButton } from "@/app/components/rentals/DeleteRentalItemButton";
import { RentalItemWithRelations } from "@/app/types/rentals";
import { format } from "date-fns";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const rentalItem = await prisma.rentalItem.findUnique({
    where: { id: params.id },
    select: { name: true },
  });

  if (!rentalItem) {
    return {
      title: "Item Not Found | Dashboard",
    };
  }

  return {
    title: `Edit ${rentalItem.name} | Dashboard`,
    description: "Edit your rental item",
  };
}

export default async function EditRentalItemPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/dashboard/rentals/${params.id}`);
  }

  // Fetch the rental item
  const rentalItem = await prisma.rentalItem.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      availableBeaches: {
        include: {
          beach: {
            include: {
              region: true,
            },
          },
        },
      },
    },
  });

  if (!rentalItem) {
    return notFound();
  }

  // Check if user owns this item
  if (rentalItem.userId !== session.user.id) {
    redirect("/dashboard/rentals");
  }

  // Fetch beaches for the form
  const beaches = await prisma.beach.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Fetch rental requests for this item
  const rentalRequests = await prisma.rentalItemRequest.findMany({
    where: {
      rentalItemId: params.id,
    },
    include: {
      renter: {
        select: {
          name: true,
          image: true,
        },
      },
      beach: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Rental Item</h1>
          <p className="text-[var(--color-text-secondary)]">
            Update your rental listing details
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/rentals/${params.id}`}
            className="btn-filter-inactive px-4 py-2 rounded-md"
          >
            View Listing
          </Link>
          <DeleteRentalItemButton id={params.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-sm p-6 mb-6 border border-[var(--color-border-light)]">
            <RentalItemForm
              beaches={beaches}
              initialData={rentalItem as unknown as RentalItemWithRelations}
            />
          </div>
        </div>

        <div>
          <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-sm p-6 mb-6 border border-[var(--color-border-light)]">
            <h2 className="heading-5 mb-4">Rental Requests</h2>

            {rentalRequests.length > 0 ? (
              <div className="space-y-4">
                {rentalRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/rentals/requests/${request.id}`}
                  >
                    <div className="border border-[var(--color-border-light)] rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-2">
                        {request.renter.image ? (
                          <img
                            src={request.renter.image}
                            alt={request.renter.name || "User"}
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              {request.renter.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                        <span className="font-medium">
                          {request.renter.name}
                        </span>
                      </div>
                      <p className="text-sm">
                        {format(new Date(request.startDate), "MMM d")} -{" "}
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Pickup at: {request.beach.name}
                      </p>
                      <div
                        className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${
                          request.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-text-secondary)]">
                No rental requests yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
