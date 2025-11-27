"use client";

import { urlForImage } from "@/app/lib/urlForImage";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import {
  Heart,
  Waves,
  Bell,
  BookOpen,
  Image as ImageIcon,
  Droplet,
  Camera,
  BookText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface HeroProps {
  data: {
    heroHeading: string;
    heroSubheading: string;
    heroImage: {
      _type: "image";
      _id: string;
      alt?: string;
      asset: {
        _ref: string;
        _type: "reference";
      };
    };
  };
}

interface ProductFeature {
  id: number;
  title: string;
  description: string;
  icon: string;
  link: string;
}

export default function HeroSection({ data }: HeroProps) {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  const textRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLSpanElement>(null);
  const buttonBgRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Add refs for GSAP animations
  const featureIconRef = useRef<HTMLDivElement>(null);
  const featureCardRef = useRef<HTMLDivElement>(null);
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  const productFeatures: ProductFeature[] = [
    {
      id: 1,
      title: "Raid",
      description: "Swiftly reveal top rated surf breaks.",
      icon: "raid-icon",
      link: "/raid",
    },
    {
      id: 2,
      title: "Alerts",
      description:
        "Set alerts for when it's good, or to your custom preferences.",
      icon: "alerts-icon",
      link: "/alerts",
    },
    {
      id: 3,
      title: "Logbook",
      description: "Log your sessions and set alerts for logs.",
      icon: "logbook-icon",
      link: "/raidlogs",
    },
    {
      id: 4,
      title: "Log Gallery",
      description:
        "Explore new spots, capture good memories and share your photos.",
      icon: "gallery-icon",
      link: "/raidlogs",
    },
  ];

  // Add a function to get emoji for each feature
  const getFeatureEmoji = (title: string) => {
    switch (title.toLowerCase()) {
      case "raid":
        return "🏄‍♂️";
      case "alerts":
        return "🔔";
      case "logbook":
        return "📓";
      case "gallery":
        return "🖼️";
      default:
        return "✨";
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoplay) {
      interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % productFeatures.length);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [autoplay, productFeatures.length]);

  const handleMouseEnter = () => setAutoplay(false);
  const handleMouseLeave = () => setAutoplay(true);

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % productFeatures.length);
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 5000);
  };

  const prevFeature = () => {
    setCurrentFeature(
      (prev) => (prev - 1 + productFeatures.length) % productFeatures.length
    );
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 5000);
  };

  const goToFeature = (index: number) => {
    setCurrentFeature(index);
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 5000);
  };

  // Add GSAP animation for the feature icon - enhanced for gaming aesthetic
  useEffect(() => {
    if (featureIconRef.current) {
      // Clear any existing animations
      gsap.killTweensOf(featureIconRef.current.querySelectorAll("*"));

      // Base animation for the container - subtle floating
      gsap.to(featureIconRef.current, {
        y: -8,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Animate the hexagonal frames
      const hexFrames = featureIconRef.current.querySelectorAll(".rounded-xl");
      gsap.to(hexFrames, {
        rotate: "+=5",
        scale: 1.05,
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2,
      });

      // Animate the decorative elements
      const decorativeElements =
        featureIconRef.current.querySelectorAll(".w-3.h-3");
      gsap.to(decorativeElements, {
        scale: 1.5,
        opacity: 0.9,
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.5,
      });

      // Get the current feature icon
      const icon = featureIconRef.current.querySelector("svg");
      const glowEffect =
        featureIconRef.current.querySelector(".filter.blur-xl");

      if (icon && glowEffect) {
        // Feature-specific icon animations
        if (productFeatures[currentFeature].title === "Raid") {
          // Create a more complex wave animation
          const wavesTl = gsap.timeline({ repeat: -1 });

          // Get individual wave paths if possible
          const wavePaths = icon.querySelectorAll("path");

          if (wavePaths.length > 0) {
            // Animate each wave path with different timing for realistic wave effect
            wavePaths.forEach((path, index) => {
              const delay = index * 0.2; // Stagger the waves

              wavesTl
                .to(
                  path,
                  {
                    y: -3 + index * 1.5, // Different heights based on position
                    scaleY: 1.1,
                    duration: 1.2,
                    ease: "sine.inOut",
                    delay: delay,
                  },
                  0
                )
                .to(
                  path,
                  {
                    y: 3 - index * 1.5,
                    scaleY: 0.9,
                    duration: 1.2,
                    ease: "sine.inOut",
                  },
                  1.2 + delay
                );
            });
          } else {
            // Fallback animation if we can't select individual paths
            wavesTl
              .to(icon, {
                y: -5,
                scaleY: 1.1,
                duration: 1.5,
                ease: "sine.inOut",
              })
              .to(icon, {
                y: 5,
                scaleY: 0.9,
                duration: 1.5,
                ease: "sine.inOut",
              });
          }

          // Add a ripple effect to the glow
          if (glowEffect) {
            gsap.to(glowEffect, {
              scale: 1.3,
              opacity: 0.5,
              duration: 2,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
        } else if (productFeatures[currentFeature].title === "Alerts") {
          // Bell icon animation - ringing effect
          const bellTl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

          bellTl
            .to(icon, {
              rotation: 20,
              transformOrigin: "top center",
              duration: 0.1,
              ease: "power1.inOut",
            })
            .to(icon, {
              rotation: -20,
              transformOrigin: "top center",
              duration: 0.1,
              ease: "power1.inOut",
            })
            .to(icon, {
              rotation: 15,
              transformOrigin: "top center",
              duration: 0.1,
              ease: "power1.inOut",
            })
            .to(icon, {
              rotation: -15,
              transformOrigin: "top center",
              duration: 0.1,
              ease: "power1.inOut",
            })
            .to(icon, {
              rotation: 10,
              transformOrigin: "top center",
              duration: 0.1,
              ease: "power1.inOut",
            })
            .to(icon, {
              rotation: 0,
              transformOrigin: "top center",
              duration: 0.1,
              ease: "power1.inOut",
            });

          // Add a pulse to the glow when the bell rings
          if (glowEffect) {
            bellTl
              .to(
                glowEffect,
                {
                  opacity: 0.7,
                  scale: 1.4,
                  duration: 0.3,
                  ease: "power1.out",
                },
                0
              )
              .to(
                glowEffect,
                {
                  opacity: 0.2,
                  scale: 1,
                  duration: 0.5,
                  ease: "power1.in",
                },
                0.3
              );
          }
        } else if (productFeatures[currentFeature].title === "Logbook") {
          // Book icon animation - page turning effect
          const bookTl = gsap.timeline({ repeat: -1, repeatDelay: 3 });

          bookTl
            .to(icon, {
              scaleX: 0.9,
              skewY: 5,
              duration: 0.5,
              ease: "power1.inOut",
            })
            .to(icon, {
              scaleX: 1,
              skewY: 0,
              duration: 0.5,
              ease: "power1.out",
            });

          // Subtle glow pulse
          if (glowEffect) {
            gsap.to(glowEffect, {
              opacity: 0.4,
              scale: 1.2,
              duration: 2.5,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
        } else if (productFeatures[currentFeature].title === "Gallery") {
          // Camera icon animation - subtle tilt with flash on exit
          gsap.to(icon, {
            rotation: 5,
            y: 3,
            duration: 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });

          // Add a subtle pulse to the glow effect
          if (glowEffect) {
            gsap.to(glowEffect, {
              opacity: 0.3,
              scale: 1.1,
              duration: 2.5,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
        }

        // Add a constant cyan glow to all icons
        gsap.to(icon, {
          filter: "drop-shadow(0 0 12px rgba(28,217,255,0.9))",
          duration: 0.5,
        });
      }
    }
  }, [currentFeature, productFeatures]);

  // Add GSAP animation for the feature card
  useEffect(() => {
    if (featureCardRef.current) {
      // Create a subtle floating animation
      gsap.to(featureCardRef.current, {
        y: 10,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Add a subtle border glow effect
      const borderTl = gsap.timeline({ repeat: -1 });

      borderTl
        .to(featureCardRef.current, {
          boxShadow:
            "0 0 15px rgba(28, 217, 255, 0.3), 0 8px 20px rgba(0, 0, 0, 0.1)",
          duration: 1.5,
          ease: "sine.inOut",
        })
        .to(featureCardRef.current, {
          boxShadow:
            "0 0 5px rgba(28, 217, 255, 0.1), 0 8px 16px rgba(0, 0, 0, 0.08)",
          duration: 1.5,
          ease: "sine.inOut",
        });
    }
  }, []);

  // Add GSAP animation for the navigation dots
  useEffect(() => {
    if (dotsContainerRef.current) {
      const dots = dotsContainerRef.current.querySelectorAll("button");

      gsap.fromTo(
        dots,
        { scale: 0.8, opacity: 0.6 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.7)",
        }
      );
    }
  }, []);

  // Render Feature Card Component (reusable for mobile and desktop)
  const renderFeatureCard = (containerClassName: string) => (
    <div className={containerClassName}>
      <div
        ref={featureCardRef}
        className="bg-gradient-to-br from-gray-900/70 to-gray-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        style={{
          borderColor: "rgba(28, 217, 255, 0.4)",
          boxShadow:
            "0 0 20px rgba(28, 217, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.15)",
        }}
      >
        <AnimatePresence
          mode="wait"
          onExitComplete={() => {
            // Flash effect on exit for camera
            if (productFeatures[currentFeature].title === "Gallery") {
              const icon = featureIconRef.current?.querySelector("svg");
              const glowEffect =
                featureIconRef.current?.querySelector(".filter.blur-xl");

              if (icon) {
                gsap.to(icon, {
                  scale: 1.5,
                  filter: "drop-shadow(0 0 30px rgba(28,217,255,1))",
                  opacity: 0,
                  duration: 0.3,
                  ease: "power2.in",
                });
              }

              if (glowEffect) {
                gsap.to(glowEffect, {
                  opacity: 1,
                  scale: 2,
                  duration: 0.3,
                  ease: "power2.in",
                });
              }
            }
          }}
        >
          <motion.div
            key={currentFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="p-4 sm:p-5 md:p-6 lg:p-8"
          >
            {/* Icon with hexagonal frame - game UI style */}
            <div
              ref={featureIconRef}
              className="flex justify-center mb-3 sm:mb-4 md:mb-6 lg:mb-8"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 relative flex items-center justify-center">
                {/* Hexagonal frame with glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl rotate-45 transform-gpu"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl -rotate-45 transform-gpu"></div>

                {/* Common white border for all features */}
                <div className="absolute inset-0 border border-white/30 rounded-xl"></div>

                {/* Feature-specific icons with cyan glow effect */}
                {productFeatures[currentFeature].title === "Raid" && (
                  <>
                    <div className="absolute inset-0 bg-[var(--color-tertiary)]/10 rounded-xl filter blur-xl"></div>
                    <Waves className="text-[var(--color-tertiary)] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 z-10 drop-shadow-[0_0_8px_rgba(28,217,255,0.7)]" />
                  </>
                )}

                {productFeatures[currentFeature].title === "Alerts" && (
                  <>
                    <div className="absolute inset-0 bg-[var(--color-tertiary)]/10 rounded-xl filter blur-xl"></div>
                    <Bell className="text-[var(--color-tertiary)] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 z-10 drop-shadow-[0_0_8px_rgba(28,217,255,0.7)]" />
                  </>
                )}

                {productFeatures[currentFeature].title === "Logbook" && (
                  <>
                    <div className="absolute inset-0 bg-[var(--color-tertiary)]/10 rounded-xl filter blur-xl"></div>
                    <BookOpen className="text-[var(--color-tertiary)] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 z-10 drop-shadow-[0_0_8px_rgba(28,217,255,0.7)]" />
                  </>
                )}

                {productFeatures[currentFeature].title === "Gallery" && (
                  <>
                    <div className="absolute inset-0 bg-[var(--color-tertiary)]/10 rounded-xl filter blur-xl"></div>
                    <Camera className="text-[var(--color-tertiary)] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 z-10 drop-shadow-[0_0_8px_rgba(28,217,255,0.7)]" />
                  </>
                )}
              </div>
            </div>

            {/* Title with futuristic badge design */}
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-lg rounded-lg px-2.5 sm:px-3 md:px-4 lg:px-5 py-1 sm:py-1.5 md:py-2 inline-block relative mb-2 sm:mb-3 md:mb-4 lg:mb-6 border-l-2 border-r-2 border-[var(--color-tertiary)]">
                <h3 className="font-primary font-bold text-sm sm:text-base md:text-lg lg:text-xl text-white tracking-wider">
                  {productFeatures[currentFeature].title.toUpperCase()}
                </h3>
              </div>

              {/* Description with tech-inspired container */}
              <div className="bg-gray-800/50 backdrop-blur-md p-2.5 sm:p-3 md:p-4 rounded-lg border border-gray-700/70 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/30 to-transparent"></div>
                <p className="font-primary text-xs sm:text-sm md:text-base text-gray-200 max-w-[240px] sm:max-w-[280px] mx-auto leading-relaxed">
                  {productFeatures[currentFeature].description}
                </p>
              </div>
            </div>

            {/* Learn More Button - Gaming style */}
            <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 text-center">
              <Link href={productFeatures[currentFeature].link}>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-primary text-xs sm:text-sm md:text-base bg-gradient-to-r from-[var(--color-tertiary)]/20 to-[var(--color-tertiary)]/10 border-[var(--color-tertiary)] text-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/30 transition-all duration-300 uppercase tracking-wider font-semibold px-3 sm:px-4 py-1.5 sm:py-2"
                  suppressHydrationWarning
                >
                  Explore
                </Button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Gaming style with improved visibility */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1 sm:px-2">
          <button
            onClick={prevFeature}
            className="bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 md:p-2.5 shadow-lg hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50 group"
            aria-label="Previous feature"
            suppressHydrationWarning
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white group-hover:text-[var(--color-tertiary)]" />
          </button>
          <button
            onClick={nextFeature}
            className="bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 md:p-2.5 shadow-lg hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50 group"
            aria-label="Next feature"
            suppressHydrationWarning
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white group-hover:text-[var(--color-tertiary)]" />
          </button>
        </div>
      </div>

      {/* Navigation Dots - Gaming style with white color */}
      <div
        ref={dotsContainerRef}
        className="flex justify-center mt-2 sm:mt-3 md:mt-4 space-x-2 sm:space-x-3"
      >
        {productFeatures.map((_, index) => (
          <button
            key={index}
            onClick={() => goToFeature(index)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              index === currentFeature
                ? "bg-white w-6 sm:w-8 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                : "bg-gray-600/70 w-1.5 sm:w-2 hover:bg-gray-500"
            }`}
            aria-label={`Go to feature ${index + 1}`}
            suppressHydrationWarning
          />
        ))}
      </div>
    </div>
  );

  if (!data) {
    return (
      <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden px-4 sm:px-6 md:px-8 lg:px-16 bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-6 h-12 border-4 border-[var(--color-tertiary)]/30 border-t-[var(--color-tertiary)] rounded-full animate-spin mx-auto"></div>
            <p className="text-white/80 font-primary animate-pulse">
              Loading hero content...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[100svh] min-h-[600px] overflow-hidden z-[1]"
    >
      {/* Background image - full screen cover, cropped from top to show surfer */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/images/unsplash-1.webp"
          alt="Woman surfer hero cover"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_bottom]"
        />
      </div>

      <div className="relative w-full h-full z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
        {/* Neon Hearts */}
        <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 flex space-x-2 sm:space-x-3 md:space-x-4 z-20">
          {[1, 2, 3].map((i) => (
            <Heart
              key={i}
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-brand-3 animate-neon-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
              stroke="currentColor"
              strokeWidth={2.5}
              fill="none"
            />
          ))}
        </div>

        {/* Mobile Layout: Stacked - Tide Raider above features */}
        <div className="flex flex-col items-center justify-center h-full gap-6 sm:gap-8 md:hidden pt-16 pb-8">
          {/* Tide Raider branding - centered on mobile */}
          <div ref={textRef} className="text-center z-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-primary tracking-tight">
              Tide Raider
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-primary mt-2 sm:mt-3 tracking-wide">
              Go Further.
            </p>
          </div>

          {/* Product Feature Slider - centered on mobile */}
          <div
            className="w-full max-w-[300px] sm:max-w-[320px] z-10"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {renderFeatureCard("relative w-full")}
          </div>
        </div>

        {/* Desktop Layout: Side-by-side - Tide Raider on left, features on right */}
        <div className="hidden md:flex items-center justify-between h-full w-full">
          {/* Left sidebar text - Tide Raider branding */}
          <div ref={textRef} className="flex-shrink-0 pr-4 lg:pr-8 z-10">
            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white font-primary tracking-tight">
              Tide Raider
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-white/90 font-primary mt-3 md:mt-4 tracking-wide">
              Go Further.
            </p>
          </div>

          {/* Product Feature Slider - right side on desktop */}
          <div
            className="flex-shrink-0 z-10"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {renderFeatureCard("relative w-[280px] md:w-[380px] lg:w-[420px]")}
          </div>
        </div>
      </div>
    </section>
  );
}
