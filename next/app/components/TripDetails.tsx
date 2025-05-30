"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowDown } from "lucide-react";
import LocalPrice from "@/app/components/LocalPrice";
import { Trip } from "@/app/types/blog";

interface TripDetailsProps {
  trip: Trip;
}

export default function TripDetails({ trip }: TripDetailsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const dayArrowRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    // Set initial states
    gsap.set(contentRef.current, { height: 0, opacity: 0 });

    const details = document.querySelector("details");
    const dayDetails = document.querySelectorAll(".day-details");

    // Main details toggle listener
    details?.addEventListener("toggle", () => {
      if (details.open) {
        gsap.to(contentRef.current, {
          height: "auto",
          opacity: 1,
          duration: 0.8,
          ease: "power4.out",
        });
        gsap.to(arrowRef.current, {
          rotation: 180,
          duration: 0.5,
          ease: "power3.out",
        });
      } else {
        gsap.to(contentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.6,
          ease: "power4.inOut",
        });
        gsap.to(arrowRef.current, {
          rotation: 0,
          duration: 0.5,
          ease: "power3.inOut",
        });
      }
    });

    // Day details toggle listeners
    dayDetails.forEach((dayDetail, index) => {
      dayDetail.addEventListener("toggle", () => {
        gsap.to(dayArrowRefs.current[index], {
          rotation: (dayDetail as HTMLDetailsElement).open ? 180 : 0,
          duration: 0.5,
          ease: "power3.inOut",
        });
      });
    });
  }, []);

  return (
    <details className="mt-12 bg-gray-50 rounded-xl p-8 transition-all duration-200 ">
      <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
        <div className="flex flex-col space-y-2">
          <h2 className="text-[1.875rem] leading-[1.5] font-bold">Trip Plan</h2>
          <div className="text-sm text-gray-600">
            <span>Total Days: {trip.days?.length || 0}</span>
            <span className="ml-4">
              Total Price:{" "}
              <LocalPrice
                amount={
                  trip.days?.reduce((total, day) => {
                    const activitiesTotal =
                      day.activities?.reduce(
                        (sum, activity) => sum + (activity.price || 0),
                        0
                      ) || 0;
                    const stayPrice = day.stay?.price || 0;
                    return total + activitiesTotal + stayPrice;
                  }, 0) || 0
                }
              />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div ref={arrowRef}>
            <ArrowDown className="w-6 h-6" />
          </div>
          <span className="text-sm text-[var--color-tertiary]">View more</span>
        </div>
      </summary>

      <div ref={contentRef}>
        {/* Trip Summary */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">Location</h4>
              <div className="space-y-1">
                {trip.country && <p>Country: {trip.country}</p>}
                {trip.region && <p>Region: {trip.region}</p>}
              </div>
            </div>
            {trip.idealMonth && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-2">Ideal Month to Travel</h4>
                <p>{trip.idealMonth}</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Itinerary */}
        {trip.days && trip.days.length > 0 && (
          <div className="space-y-6">
            {trip.days.map((day, index) => (
              <details
                key={index}
                className="group bg-white rounded-lg shadow-sm day-details"
                open={index === 0}
              >
                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {day.dayNumber}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">Day {day.dayNumber}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <LocalPrice
                      amount={
                        (day.activities?.reduce(
                          (sum, activity) => sum + (activity.price || 0),
                          0
                        ) || 0) + (day.stay?.price || 0)
                      }
                    />
                    <span
                      ref={(el) => {
                        dayArrowRefs.current[index] = el;
                      }}
                      className="transform"
                    >
                      <ArrowDown className="w-6 h-6" />
                    </span>
                  </div>
                </summary>

                <div className="p-6 pt-0">
                  {/* Activities */}
                  {day.activities && day.activities.length > 0 && (
                    <div className="mb-8 mt-4">
                      <h4 className="text-lg font-semibold mb-4">Activities</h4>
                      <div className="space-y-4">
                        {day.activities.map((activity, actIndex) => (
                          <div
                            key={actIndex}
                            className="flex justify-between items-start bg-gray-50 p-3 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-sm text-gray-600">
                                Duration: {activity.duration} hours
                              </p>
                              {activity.transport &&
                                activity.transport !== "None" && (
                                  <p className="text-sm text-gray-600">
                                    Transport: {activity.transport}
                                  </p>
                                )}
                              {activity.bookingURL && (
                                <a
                                  href={activity.bookingURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-[var(--color-tertiary)] underline"
                                >
                                  Book Now
                                </a>
                              )}
                            </div>
                            {activity.price > 0 && (
                              <LocalPrice amount={activity.price} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accommodation */}
                  {day.stay && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-4">
                        Where to Stay
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{day.stay.title}</p>
                            {day.stay.bookingURL && (
                              <a
                                href={day.stay.bookingURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-black hover:underline"
                              >
                                Book Accommodation
                              </a>
                            )}
                          </div>
                          {day.stay.price > 0 && (
                            <LocalPrice amount={day.stay.price} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daily Total */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">Daily Total</h4>
                      <LocalPrice
                        amount={
                          (day.activities?.reduce(
                            (sum, activity) => sum + (activity.price || 0),
                            0
                          ) || 0) + (day.stay?.price || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Grand Total */}
        <div className="mt-8 pt-8 border-t-2 border-gray-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Grand Total</h3>
            <LocalPrice
              amount={
                trip.days?.reduce((total, day) => {
                  const activitiesTotal =
                    day.activities?.reduce(
                      (sum, activity) => sum + (activity.price || 0),
                      0
                    ) || 0;
                  const stayPrice = day.stay?.price || 0;
                  return total + activitiesTotal + stayPrice;
                }, 0) || 0
              }
            />
          </div>
        </div>
      </div>
    </details>
  );
}
