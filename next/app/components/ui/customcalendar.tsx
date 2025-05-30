"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { cn } from "@/app/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

interface CustomCalendarProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabledDates?: Date[];
  enabledDates?: Date[];
  className?: string;
}

export function CustomCalendar({
  value,
  onChange,
  disabledDates = [],
  enabledDates,
  className,
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setCurrentMonth(value);
    }
  }, [value]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    onChange?.(day);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create array for day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    if (enabledDates && enabledDates.length > 0) {
      return !enabledDates.some((enabledDate) => isSameDay(enabledDate, date));
    }

    return disabledDates.some((disabledDate) => isSameDay(disabledDate, date));
  };

  return (
    <div className={cn("p-3 bg-white rounded-md shadow-sm", className)}>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={prevMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-primary font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-primary font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-8" />
        ))}

        {daysInMonth.map((day) => {
          const isDisabled = isDateDisabled(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          return (
            <Button
              key={day.toString()}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-full font-primary rounded-md",
                isSelected &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isCurrentDay && !isSelected && "border border-primary",
                !isSameMonth(day, currentMonth) && "text-gray-300",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={isDisabled}
              onClick={() => !isDisabled && handleDateClick(day)}
            >
              {format(day, "d")}
            </Button>
          );
        })}

        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
          <div key={`empty-end-${index}`} className="h-8" />
        ))}
      </div>
    </div>
  );
}
