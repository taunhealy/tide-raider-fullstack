// app/sections/About.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { urlForImage } from "@/app/lib/urlForImage";

interface AboutProps {
  data: {
    aboutHeading?: string;
    aboutDescription1?: string;
    aboutDescription1Image?: any;
    aboutDescription2?: string;
    aboutDescription2Image?: any;
  };
}

export default function About({ data }: AboutProps) {
  return (
    <section className="pt-16 pb-24 md:pt-20 md:pb-32 px-4 md:px-8 lg:px-16 bg-[var(--color-bg-primary)]">
      <div className="container mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          <div className="order-2 lg:order-1">
            <div className="relative h-[240px] md:h-[400px] lg:h-[540px] rounded-2xl overflow-hidden">
              <div
                className="absolute inset-0 bg-white rounded-xl border border-[var(--color-tertiary)]/40 flex items-center justify-center"
                style={{
                  boxShadow:
                    "0 0 20px rgba(28, 217, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div className="absolute inset-0"></div>

                <div
                  className="relative w-[85%] h-[85%] rounded-lg overflow-hidden border border-[var(--color-tertiary)]/70"
                  style={{
                    boxShadow: "0 0 15px rgba(28, 217, 255, 0.3)",
                  }}
                >
                  <Image
                    src="https://media.tideraider.com/austin-neill-uHD0uyp79Dg-unsplash.webp"
                    alt="Studio Ghibli-style illustration for About section"
                    title="Photographer: Austin Neill"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                    priority
                  />
                </div>

                <div className="absolute top-4 left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#f8dab3]" />
                <div className="absolute bottom-4 right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[var(--color-tertiary)]" />
                <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full opacity-90"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full opacity-70"></div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex flex-col justify-center">
            <div className="bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl p-6 md:p-8 lg:p-10 shadow-sm border border-gray-100 max-w-[540px]">
              <h2 className="font-primary text-xl md:text-2xl lg:text-3xl font-semibold mb-4 md:mb-6">
                Explore new surf breaks and share your tales.
              </h2>

              <p className="font-primary text-base md:text-lg text-gray-700 mb-6">
                Tide Raider is a platform for travelling surfers and surf
                photographers to explore, share and promote surf travel.
              </p>
              <Button>
                <span>Let's go</span>
              </Button>

              <div className="mt-8 pt-6 border-t border-white backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white-50/80 backdrop-blur-sm p-4 rounded-lg">
                    <h3 className="font-primary text-lg font-medium mb-2">
                      Surfers
                    </h3>
                    <p className="font-primary text-sm text-gray-600">
                      Exploring breaks, riding with unfamiliar people, sharing
                      good waves.
                    </p>
                  </div>
                  <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-lg">
                    <h3 className="font-primary text-lg font-medium mb-2">
                      Photographers
                    </h3>
                    <p className="font-primary text-sm text-gray-600">
                      Surf photographers are an integral part of inspiring and
                      empowering epic journeys.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
