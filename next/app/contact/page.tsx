"use client";

import React, { useState } from "react";
import { Mail, Send, MessageSquare, Shield, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    
    // In a real app, you'd send this to an API
    // For now, we'll simulate a delay
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Reset success message after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] font-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-black py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_center,_var(--color-tertiary)_0%,_transparent_70%)] opacity-10 blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6">
            Get in <span className="text-[var(--color-tertiary)]">Touch</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Have questions about Tide Raider? Our team is here to help you navigate the best swells.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transform transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Mail className="text-[var(--color-tertiary)]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-500 mb-4 text-sm leading-relaxed">
                Direct all inquiries to our primary support channel.
              </p>
              <a 
                href="mailto:admin@tideraider.com" 
                className="text-lg font-black text-[var(--color-tertiary)] hover:underline break-all"
              >
                admin@tideraider.com
              </a>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transform transition-all hover:scale-[1.02]">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="text-purple-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-500 mb-4 text-sm leading-relaxed">
                Join our Discord or WhatsApp groups for real-time updates.
              </p>
              <button className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-tertiary)] transition-colors">
                COMING SOON
              </button>
            </div>

            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl text-white">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="text-yellow-400 fill-yellow-400" size={20} />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Priority Support</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Premium members get accelerated response times and direct access to wave analysts.
              </p>
              <Button variant="tertiary" className="w-full" onClick={() => window.location.href='/pricing'}>
                Go Premium
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-8">
                Send a <span className="text-[var(--color-tertiary)]">Message</span>
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-tertiary)] focus:border-transparent outline-none transition-all font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-tertiary)] focus:border-transparent outline-none transition-all font-medium"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-tertiary)] focus:border-transparent outline-none transition-all font-medium"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-tertiary)] focus:border-transparent outline-none transition-all font-medium resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto min-w-[200px] h-14 rounded-xl flex items-center justify-center gap-2 group"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : status === "success" ? (
                      "Message Sent!"
                    ) : (
                      <>
                        Send Message
                        <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </>
                    )}
                  </Button>
                </div>
                
                {status === "success" && (
                  <p className="text-green-500 font-bold text-center md:text-left animate-fade-in">
                    Thank you! We'll get back to you shortly.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 pt-16">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="text-gray-400" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Secure Communication</h4>
              <p className="text-sm text-gray-500">Your data is protected by industry-standard encryption protocols.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="text-gray-400" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Fast Response</h4>
              <p className="text-sm text-gray-500">We aim to respond to all inquiries within 24-48 business hours.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare className="text-gray-400" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Global Coverage</h4>
              <p className="text-sm text-gray-500">Supporting surfers across all major continents and coastal regions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
