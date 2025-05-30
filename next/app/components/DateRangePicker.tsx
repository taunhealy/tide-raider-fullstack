"use client";

import { useState, useEffect } from "react";
import { DayPicker, DayClickEventHandler } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: { startDate: Date | null; endDate: Date | null }) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  minDate = new Date(),
  maxDate,
  disabledDates = [],
}: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startDate || undefined,
    to: endDate || undefined,
  });
  
  // Add state for number of weeks
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(1);

  // ... existing code ...

  const handleDayClick: DayClickEventHandler = (day, modifiers) => {
    if (modifiers.disabled) return;

    // Only set the start date when clicking a day
    const range = { ...selectedRange };
    range.from = day;
    
    // Calculate end date based on number of weeks
    if (range.from) {
      const newEndDate = new Date(range.from);
      newEndDate.setDate(range.from.getDate() + (numberOfWeeks * 7) - 1);
      
      // Check if the calculated end date is valid
      if (!maxDate || newEndDate <= maxDate) {
        range.to = newEndDate;
      }
    }

    setSelectedRange(range);
    onChange({
      startDate: range.from || null,
      endDate: range.to || null,
    });
  };

  // Function to handle number of weeks change
  const handleWeeksChange = (weeks: number) => {
    setNumberOfWeeks(weeks);
    
    // Update end date based on new number of weeks
    if (selectedRange.from) {
      const newEndDate = new Date(selectedRange.from);
      newEndDate.setDate(selectedRange.from.getDate() + (weeks * 7) - 1);
      
      // Check if the calculated end date is valid
      if (!maxDate || newEndDate <= maxDate) {
        const updatedRange = {
          ...selectedRange,
          to: newEndDate
        };
        
        setSelectedRange(updatedRange);
        onChange({
          startDate: updatedRange.from || null,
          endDate: updatedRange.to || null,
        });
      }
    }
  };

  // Disable dates before minDate, after maxDate, and any specific disabled dates
  const disabledDays = [
    { before: minDate },
    ...(maxDate ? [{ after: maxDate }] : []),
    ...disabledDates,
  ];

  return (
    <div className="bg-[var(--color-bg-primary)] rounded-md shadow-sm border border-[var(--color-border-light)] p-4 font-primary">
      <div className="mb-3 p-3 bg-[var(--color-bg-secondary)] rounded-md text-sm text-[var(--color-text-secondary)]">
        <p className="font-medium">Rental Policy:</p>
        <p>Rentals must be booked in weekly increments (minimum 1 week)</p>
      </div>

      {/* Add week selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Number of Weeks:
        </label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => numberOfWeeks > 1 && handleWeeksChange(numberOfWeeks - 1)}
            disabled={numberOfWeeks <= 1}
            className="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-l-md border border-[var(--color-border-light)] disabled:opacity-50"
          >
            -
          </button>
          <span className="px-4 py-1 border-t border-b border-[var(--color-border-light)] font-medium">
            {numberOfWeeks}
          </span>
          <button
            type="button"
            onClick={() => handleWeeksChange(numberOfWeeks + 1)}
            className="px-3 py-1 bg-[var(--color-bg-secondary)] rounded-r-md border border-[var(--color-border-light)]"
          >
            +
          </button>
        </div>
      </div>

      <DayPicker
        mode="range"
        selected={selectedRange}
        onDayClick={handleDayClick}
        disabled={disabledDays}
        numberOfMonths={2}
        pagedNavigation
        showOutsideDays
        fixedWeeks
        styles={{
          caption: { color: "var(--color-tertiary)" },
          day_selected: { backgroundColor: "var(--color-tertiary)" },
          day_range_middle: { backgroundColor: "#f7f7f7" },
          day_range_end: { backgroundColor: "var(--color-tertiary)" },
          day_range_start: { backgroundColor: "var(--color-tertiary)" },
        }}
        modifiersClassNames={{
          selected: "bg-[var(--color-tertiary)] text-white rounded-full",
          range_middle: "bg-[var(--color-bg-secondary)]",
          range_start: "bg-[var(--color-tertiary)] text-white rounded-full",
          range_end: "bg-[var(--color-tertiary)] text-white rounded-full",
        }}
      />

      <div className="mt-4 flex justify-between text-sm">
        <div>
          <span className="font-medium text-[var(--color-text-primary)]">
            Start:
          </span>{" "}
          <span className="text-[var(--color-text-secondary)]">
            {selectedRange.from
              ? selectedRange.from.toLocaleDateString()
              : "Not selected"}
          </span>
        </div>
        <div>
          <span className="font-medium text-[var(--color-text-primary)]">
            End:
          </span>{" "}
          <span className="text-[var(--color-text-secondary)]">
            {selectedRange.to
              ? selectedRange.to.toLocaleDateString()
              : "Not selected"}
          </span>
        </div>
      </div>

      {selectedRange.from && selectedRange.to && (
        <div className="mt-3 p-2 bg-[var(--color-bg-secondary)] rounded-md text-sm text-[var(--color-tertiary)] font-medium">
          {numberOfWeeks} week(s) rental
        </div>
      )}
    </div>
  );
}