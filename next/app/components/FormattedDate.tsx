import { format } from "date-fns";

export default function FormattedDate({ date }: { date?: number | null }) {
  if (!date) return null; // Handle null/undefined

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return null; // Handle invalid dates

  return (
    <time
      dateTime={dateObj.toISOString()}
      className="font-primary text-gray-600"
    >
      {format(dateObj, "dd/MM/yyyy")}
    </time>
  );
}
