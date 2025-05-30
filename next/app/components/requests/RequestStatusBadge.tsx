import { RequestStatus } from "@prisma/client";

interface RequestStatusBadgeProps {
  status?:
    | RequestStatus
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  if (!status) return null;

  const statusConfig = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800",
      label: "Pending",
    },
    APPROVED: {
      color: "bg-green-100 text-green-800",
      label: "Approved",
    },
    REJECTED: {
      color: "bg-red-100 text-red-800",
      label: "Rejected",
    },
    CANCELLED: {
      color: "bg-gray-100 text-gray-800",
      label: "Cancelled",
    },
    COMPLETED: {
      color: "bg-blue-100 text-blue-800",
      label: "Completed",
    },
    // Keep these for backward compatibility
    ACCEPTED: {
      color: "bg-green-100 text-green-800",
      label: "Accepted",
    },
    DECLINED: {
      color: "bg-red-100 text-red-800",
      label: "Declined",
    },
    MODIFIED: {
      color: "bg-blue-100 text-blue-800",
      label: "Modified",
    },
    EXPIRED: {
      color: "bg-gray-100 text-gray-800",
      label: "Expired",
    },
  };

  const config = statusConfig[status] || {
    color: "bg-gray-100 text-gray-800",
    label: status,
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.color} font-primary`}
    >
      {config.label}
    </span>
  );
}
