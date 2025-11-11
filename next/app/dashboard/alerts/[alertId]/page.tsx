import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@/app/lib/utils/dateUtils";
import { AlertDetailCard } from "@/app/components/alerts/AlertDetailCard";
import { AlertHistoryList } from "@/app/components/alerts/AlertHistoryList";
import { Button } from "@/app/components/ui/Button";
import { ArrowLeft, Bell, Edit } from "lucide-react";
import Link from "next/link";

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ alertId: string }>;
}) {
  const { alertId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/alerts");
  }

  const alert = await prisma.alert.findUnique({
    where: {
      id: alertId,
    },
    include: {
      checks: {
        orderBy: {
          checkedAt: "desc",
        },
        take: 10,
      },
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      logEntry: {
        include: {
          beach: true,
          forecast: true,
        },
      },
      properties: true,
    },
  });

  if (!alert || alert.userId !== session.user.id) {
    notFound();
  }

  // Alert properties are loaded through the relation
  const alertProperties = alert.properties || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/alerts"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 font-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Alerts
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-primary text-2xl font-bold text-gray-900">
            {alert.name}
          </h1>
          <p className="font-primary text-gray-500 mt-1">
            {alert.active ? "Active" : "Inactive"}
          </p>
        </div>
        <Link href={`/alerts/${alert.id}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Alert
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertDetailCard alert={alert} alertProperties={alertProperties} />

          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="font-primary text-lg font-semibold mb-4">
              Recent Notifications
            </h2>
            {alert.notifications.length > 0 ? (
              <div className="space-y-4">
                {alert.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          notification.success
                            ? "bg-cyan-100 text-cyan-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-primary text-sm text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                        <p className="font-primary text-sm mt-1 whitespace-pre-line">
                          {notification.details}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-primary text-gray-500 text-sm">
                No notifications have been sent for this alert yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-primary text-lg font-semibold mb-4">
              Alert Details
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-primary text-sm font-medium text-gray-500">
                  Region
                </h3>
                <p className="font-primary">{alert.regionId}</p>
              </div>

              <div>
                <h3 className="font-primary text-sm font-medium text-gray-500">
                  Beach
                </h3>
                <p className="font-primary">
                  {alert.logEntry?.beach?.name || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="font-primary text-sm font-medium text-gray-500">
                  Alert Type
                </h3>
                <p className="font-primary capitalize">
                  {alert.alertType === "VARIABLES"
                    ? "Forecast Variables"
                    : "Star Rating"}
                </p>
              </div>

              <div>
                <h3 className="font-primary text-sm font-medium text-gray-500">
                  Notification Method
                </h3>
                <p className="font-primary capitalize">
                  {alert.notificationMethod}
                </p>
              </div>

              <div>
                <h3 className="font-primary text-sm font-medium text-gray-500">
                  Status
                </h3>
                <div
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alert.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {alert.active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="font-primary text-lg font-semibold mb-4">
              Alert History
            </h2>
            <AlertHistoryList checks={alert.checks} />
          </div>
        </div>
      </div>
    </div>
  );
}
