"use client";

import GradientButton, { HiddenGemsButton } from "@/app/components/ui/GradientButton";
import { useState } from "react";

/**
 * Showcase page for GradientButton component
 * Navigate to /components/gradient-button-showcase to view
 */
export default function GradientButtonShowcase() {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({
    purplePink: true,
    bluePurple: false,
    greenBlue: false,
    orangeRed: false,
    gray: false,
    outline: false,
  });

  const toggleState = (key: string) => {
    setActiveStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            GradientButton Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            A comprehensive collection of button styles and variants
          </p>
        </div>

        {/* All Variants */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            All Variants (Click to Toggle)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Purple-Pink</p>
              <GradientButton
                variant="purple-pink"
                active={activeStates.purplePink}
                onClick={() => toggleState("purplePink")}
              >
                Purple Pink
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Blue-Purple</p>
              <GradientButton
                variant="blue-purple"
                active={activeStates.bluePurple}
                onClick={() => toggleState("bluePurple")}
              >
                Blue Purple
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Green-Blue</p>
              <GradientButton
                variant="green-blue"
                active={activeStates.greenBlue}
                onClick={() => toggleState("greenBlue")}
              >
                Green Blue
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Orange-Red</p>
              <GradientButton
                variant="orange-red"
                active={activeStates.orangeRed}
                onClick={() => toggleState("orangeRed")}
              >
                Orange Red
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Gray</p>
              <GradientButton
                variant="gray"
                active={activeStates.gray}
                onClick={() => toggleState("gray")}
              >
                Gray
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Outline</p>
              <GradientButton
                variant="outline"
                active={activeStates.outline}
                onClick={() => toggleState("outline")}
              >
                Outline
              </GradientButton>
            </div>
          </div>
        </section>

        {/* Sizes */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sizes
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <GradientButton variant="purple-pink" active={true} size="sm">
              Small
            </GradientButton>
            <GradientButton variant="purple-pink" active={true} size="md">
              Medium
            </GradientButton>
            <GradientButton variant="purple-pink" active={true} size="lg">
              Large
            </GradientButton>
          </div>
        </section>

        {/* With Icons */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            With Icons
          </h2>
          <div className="flex flex-wrap gap-4">
            <GradientButton
              variant="purple-pink"
              active={true}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
            >
              Sparkle
            </GradientButton>
            <GradientButton
              variant="blue-purple"
              active={true}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            >
              Search
            </GradientButton>
            <GradientButton
              variant="green-blue"
              active={true}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Success
            </GradientButton>
          </div>
        </section>

        {/* With Badges */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            With Badges
          </h2>
          <div className="flex flex-wrap gap-4">
            <GradientButton variant="purple-pink" active={true} badge="New">
              Features
            </GradientButton>
            <GradientButton variant="blue-purple" active={true} badge={5}>
              Notifications
            </GradientButton>
            <GradientButton variant="green-blue" active={true} badge="Active">
              Status
            </GradientButton>
          </div>
        </section>

        {/* Specialized Buttons */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Specialized Buttons
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">HiddenGemsButton (Active)</p>
              <HiddenGemsButton active={true} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">HiddenGemsButton (Inactive)</p>
              <HiddenGemsButton active={false} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">HiddenGemsButton (Custom Text)</p>
              <HiddenGemsButton active={true}>Secret Spots</HiddenGemsButton>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            States
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active</p>
              <GradientButton variant="purple-pink" active={true}>
                Active State
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Inactive</p>
              <GradientButton variant="purple-pink" active={false}>
                Inactive State
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Disabled (Active)</p>
              <GradientButton variant="purple-pink" active={true} disabled={true}>
                Disabled Active
              </GradientButton>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Disabled (Inactive)</p>
              <GradientButton variant="purple-pink" active={false} disabled={true}>
                Disabled Inactive
              </GradientButton>
            </div>
          </div>
        </section>

        {/* Full Width */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Full Width
          </h2>
          <div className="space-y-4">
            <GradientButton variant="purple-pink" active={true} fullWidth={true}>
              Full Width Button
            </GradientButton>
            <GradientButton variant="blue-purple" active={true} fullWidth={true} size="lg">
              Large Full Width
            </GradientButton>
          </div>
        </section>

        {/* Real-World Example */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Real-World Example: Filter Tabs
          </h2>
          <div className="flex flex-wrap gap-2">
            <GradientButton variant="purple-pink" active={true} badge="12">
              All Beaches
            </GradientButton>
            <HiddenGemsButton active={false} />
            <GradientButton variant="blue-purple" active={false}>
              Favorites
            </GradientButton>
            <GradientButton variant="green-blue" active={false} badge="3">
              Nearby
            </GradientButton>
          </div>
        </section>
      </div>
    </div>
  );
}
