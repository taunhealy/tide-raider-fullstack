import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { AD_CATEGORIES } from "@/app/lib/advertising/constants";
import { format } from "date-fns";
import CancelAdSubscriptionButton from "@/app/components/advertising/CancelAdSubscriptionButton";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const ad = await prisma.ad.findUnique({
    where: { id: params.id },
    select: { companyName: true, title: true },
  });

  if (!ad) {
    return {
      title: "Ad Not Found | Dashboard",
    };
  }

  return {
    title: `${ad.title || ad.companyName} | Dashboard`,
    description: "Manage your advertisement",
  };
}

export default async function AdDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/dashboard/ads/${params.id}`);
  }

  // Fetch the ad
  const ad = await prisma.ad.findUnique({
    where: { id: params.id },
    include: {
      region: true,
      adRequest: true,
      beachConnections: {
        include: {
          beach: true,
        },
      },
    },
  });

  if (!ad) {
    return notFound();
  }

  // Check if user owns this ad
  if (ad.userId !== session.user.id) {
    redirect("/dashboard/ads");
  }

  const category = AD_CATEGORIES[ad.category as keyof typeof AD_CATEGORIES];
  const monthlyPrice = category?.monthlyPrice || 0;

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{ad.title || ad.companyName}</h1>
          <p className="text-[var(--color-text-secondary)]">
            Manage your advertisement
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/ads"
            className="btn-filter-inactive px-4 py-2 rounded-md"
          >
            Back to Ads
          </Link>
          <Link
            href={`/dashboard/ads/${ad.id}/edit`}
            className="btn-secondary px-4 py-2 rounded-md"
          >
            Edit Ad
          </Link>
          <Link
            href="/advertising"
            className="btn-primary px-4 py-2 rounded-md"
          >
            Create New Ad
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-sm p-6 mb-6 border border-[var(--color-border-light)]">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="heading-5">Ad Preview</h2>
              </div>
              {ad.imageUrl ? (
                <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-lg mb-4">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title || ad.companyName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center rounded-lg mb-4">
                  <span className="text-white font-bold text-xl">
                    {ad.companyName}
                  </span>
                </div>
              )}

              <div className="mb-2">
                <h3 className="font-bold text-xl">
                  {ad.title || ad.companyName}
                </h3>
              </div>

              <div className="mb-4">
                <a
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline block"
                >
                  {ad.linkUrl}
                </a>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="heading-5">Ad Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">
                    {category?.label || ad.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Region</p>
                  <p className="font-medium">
                    {ad.region?.name ||
                      ad.regionId.charAt(0).toUpperCase() +
                        ad.regionId.slice(1).toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p
                    className={`font-medium ${
                      ad.status === "active"
                        ? "text-green-600"
                        : ad.status === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Price</p>
                  <p className="font-medium">${monthlyPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(ad.startDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">
                    {format(new Date(ad.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {ad.beachConnections.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h2 className="heading-5 mb-4">Targeted Beaches</h2>
                <div className="flex flex-wrap gap-2">
                  {ad.beachConnections.map(({ beach }) => (
                    <span
                      key={beach.id}
                      className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                    >
                      {beach.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-sm p-6 mb-6 border border-[var(--color-border-light)]">
            <h2 className="heading-5 mb-4">Subscription Details</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className="font-medium">
                {ad.paypalSubscriptionId ? "Paid" : "Pending Payment"}
              </p>
            </div>

            {ad.paypalSubscriptionId && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Subscription ID</p>
                <p className="font-medium text-sm break-all">
                  {ad.paypalSubscriptionId}
                </p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-500">Renewal Date</p>
              <p className="font-medium">
                {format(new Date(ad.endDate), "MMM d, yyyy")}
              </p>
            </div>

            {ad.status === "active" && (
              <div className="mt-6">
                <CancelAdSubscriptionButton adId={ad.id} />
              </div>
            )}

            {ad.status === "pending" && !ad.paypalSubscriptionId && (
              <div className="mt-6">
                <Link
                  href={`/advertising/checkout?adId=${ad.id}`}
                  className="w-full btn-primary block text-center"
                >
                  Complete Payment
                </Link>
              </div>
            )}
          </div>

          <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-sm p-6 border border-[var(--color-border-light)]">
            <h2 className="heading-5 mb-4">Need Help?</h2>
            <p className="text-sm text-gray-600 mb-4">
              If you need assistance with your ad or have questions about your
              subscription, our support team is here to help.
            </p>
            <Link
              href="/contact"
              className="text-blue-600 hover:underline text-sm"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
