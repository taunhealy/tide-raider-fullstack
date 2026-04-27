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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 max-w-6xl py-10">
        {/* Header Section - Matching Alerts Page */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Support Channel</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Have questions about Tide Raider? Our team is here to help you navigate the best swells.
            </p>
          </div>
        </div>

        {/* Main Content Container - Matching Alerts Page Style */}
        <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-6 md:p-10 border border-white/60 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/80 shadow-sm transition-all hover:shadow-md">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                  <Mail className="text-blue-500" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-500 mb-4 text-sm leading-relaxed">
                  Direct all inquiries to our primary support channel.
                </p>
                <a 
                  href="mailto:admin@tideraider.com" 
                  className="text-base font-black text-gray-900 hover:text-blue-600 transition-colors break-all"
                >
                  admin@tideraider.com
                </a>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/80 shadow-sm transition-all hover:shadow-md">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="text-purple-500" size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Community</h3>
                <p className="text-gray-500 mb-4 text-sm leading-relaxed">
                  Join our Discord or WhatsApp groups for real-time updates.
                </p>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  COMING SOON
                </span>
              </div>

              <div className="bg-gray-900 p-8 rounded-3xl shadow-xl text-white">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="text-yellow-400 fill-yellow-400" size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Priority Support</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Premium members get accelerated response times and direct access to wave analysts.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 border-none font-bold text-xs uppercase tracking-widest" 
                  onClick={() => window.location.href='/pricing'}
                >
                  Go Premium
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">
                  Send a <span className="text-blue-600">Message</span>
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={status === "sending"}
                      className="w-full md:w-auto min-w-[180px] h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2 group font-bold text-sm transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-70"
                    >
                      {status === "sending" ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : status === "success" ? (
                        "Message Sent!"
                      ) : (
                        <>
                          Send Message
                          <Send size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  {status === "success" && (
                    <p className="text-green-600 text-sm font-bold animate-fade-in">
                      Thank you! We'll get back to you shortly.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info - Updated to match clean aesthetic */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-200/60 pt-16">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
              <Shield className="text-gray-400" size={18} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Secure Communication</h4>
              <p className="text-xs text-gray-500 leading-relaxed text-pretty">Your data is protected by industry-standard encryption protocols.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
              <Zap className="text-gray-400" size={18} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Fast Response</h4>
              <p className="text-xs text-gray-500 leading-relaxed text-pretty">We aim to respond to all inquiries within 24-48 business hours.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
              <MessageSquare className="text-gray-400" size={18} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Global Coverage</h4>
              <p className="text-xs text-gray-500 leading-relaxed text-pretty">Supporting surfers across all major continents and coastal regions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
