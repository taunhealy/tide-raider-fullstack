import { Zap, Star, Sparkles, Check, Bell, ShieldCheck } from "lucide-react";

export const MEMBERSHIP_PERKS = [
  {
    text: "Unlimited WhatsApp & Email surf alerts",
    icon: Zap,
    color: "text-brand-3"
  },
  {
    text: "30 Credits per month",
    icon: Sparkles,
    color: "text-brand-3"
  },

  {
    text: "Custom alerts for your favorite spots",
    icon: Bell,
    color: "text-brand-3"
  },
  { text: "Credits never expire", icon: ShieldCheck, color: "text-blue-400" },

];

export const FREE_PERKS = [
  {
    text: "Basic weather & swell data",
    icon: Check,
    color: "text-slate-400"
  },

  {
    text: "Standard logs & AI reports access",
    icon: Check,
    color: "text-slate-400"
  },
  {
    text: "Limited to 1 active alert",
    icon: Bell,
    color: "text-slate-400"
  },
];
