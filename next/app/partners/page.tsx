"use client";

import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export default function PartnersPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    paypalEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register partner");
      }

      setGeneratedCode(data.code);
      setSuccess(true);
      toast.success("Registration successful!");
    } catch (error) {
      console.error("Partner registration error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[var(--color-bg-primary)] min-h-screen py-20 px-4">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <div className="mb-6 text-green-500">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="heading-2 mb-4">Welcome to the Crew!</h2>
          <p className="text-large text-[var(--color-text-secondary)] mb-8">
            Your partner account is live. Start sharing your code to earn 20%
            commissions.
          </p>

          <div className="bg-gray-50 p-6 rounded-md border border-dashed border-gray-300 mb-8">
            <p className="text-sm text-gray-500 mb-2">YOUR PROMO CODE</p>
            <p className="text-4xl font-bold tracking-wider text-[var(--color-primary)]">
              {generatedCode}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              We've sent a welcome email to {formData.email} with your dashboard
              login details.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div>
            <h1 className="heading-1 mb-6 text-[var(--color-text-primary)]">
              Turn Your Stoke Into Income
            </h1>
            <p className="text-large text-[var(--color-text-secondary)] mb-8">
              Join the Tide Raider Partner Program. Share surf alerts with your
              community and earn recurring revenue.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: "20% Lifetime Commission",
                  desc: "Earn 20% of every subscription payment, forever.",
                },
                {
                  title: "10% Discount for Your Community",
                  desc: "Give your customers 10% off their subscription.",
                },
                {
                  title: "Automated Monthly Payouts",
                  desc: "Get paid directly to your PayPal on the 1st of every month.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center text-[var(--color-secondary)] font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="heading-4 mb-6">Become a Partner</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Name
                </label>
                <Input
                  required
                  placeholder="e.g. Kalk Bay Surf Shop"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Person
                </label>
                <Input
                  required
                  placeholder="Your Name"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <Input
                  required
                  type="email"
                  placeholder="shop@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  PayPal Email (for payouts)
                </label>
                <Input
                  required
                  type="email"
                  placeholder="payments@example.com"
                  value={formData.paypalEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, paypalEmail: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be a valid PayPal account to receive commissions.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Join Partner Program"}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
                  By joining, you agree to our Terms. Payouts are automated 
                  via PayPal on the 1st of each month for balances exceeding $20.00.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
