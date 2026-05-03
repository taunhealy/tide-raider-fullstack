import { Zap, ShieldCheck, Sparkles, Waves, ArrowRight, Lock, CheckCircle2, CreditCard } from "lucide-react";
import { cn } from "@/app/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useBackendAuth();
  const {
    isSubscribed,
    hasActiveTrial,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  // Auto-populate data & handle redirects (keeping your existing logic)
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      let cancelled = false;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const checkSubscription = async () => {
        try {
          const response = await fetch("/api/paypal/subscription-status", {
            credentials: "include",
            signal: controller.signal,
          });
          if (!cancelled && response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data.subscriptionStatus);
          }
        } catch (error: any) {
          if (!cancelled) setSubscriptionStatus(null);
        } finally {
          clearTimeout(timeoutId);
        }
      };
      checkSubscription();
      return () => { cancelled = true; controller.abort(); clearTimeout(timeoutId); };
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "unauthenticated" && !session?.user) {
      router.push("/login?redirect=/checkout");
    }
  }, [status, session?.user, router]);

  useEffect(() => {
    const hasActiveSubscription = isSubscribed || hasActiveTrial || subscriptionStatus === "ACTIVE";
    if (status === "authenticated" && hasActiveSubscription && (subscriptionStatus === "ACTIVE" || isSubscribed || hasActiveTrial)) {
      router.push("/dashboard?tab=billing");
    }
  }, [status, isSubscribed, hasActiveTrial, subscriptionStatus, router]);

  const handleCheckout = async () => {
    if (!session?.user) {
      setError("Please sign in to continue");
      return;
    }

    const hasActiveSubscription = isSubscribed || hasActiveTrial || subscriptionStatus === "ACTIVE";
    if (hasActiveSubscription) {
      setError("You already have an active subscription!");
      router.push("/dashboard?tab=billing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to create subscription");
      }

      const data = await response.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("No approval URL received from PayPal");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  };

  if (status === "loading" && !session?.user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-3/20 border-t-brand-3 rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Initializing Secure Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-primary selection:bg-brand-3/20 overflow-x-hidden">
      {/* Tactical Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-3/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          
          {/* Value Proposition Side */}
          <div className="space-y-10 order-2 lg:order-1">
            <header className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-3 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-3">System Upgrade Available</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-3 to-indigo-600">Premium Hunt</span>
              </h1>
              <p className="text-slate-500 font-medium text-lg max-w-md">
                Unlock high-fidelity intelligence and automated tactical alerts across the entire network.
              </p>
            </header>

            <div className="grid gap-6">
              {[
                { 
                  title: "Tactical Intelligence", 
                  desc: "Access 30 monthly AI credits for deep-dive condition analysis and mission planning.",
                  icon: Sparkles
                },
                { 
                  title: "Unlimited Alerts", 
                  desc: "Set unlimited real-time triggers for wind, swell, and tide windows.",
                  icon: Zap
                },
                { 
                  title: "Hidden Gems Access", 
                  desc: "Unlock our curated database of secret breaks and regional high-scorers.",
                  icon: Waves
                }
              ].map((perk, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:border-brand-3/30 transition-colors">
                    <perk.icon className="w-5 h-5 text-brand-3" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{perk.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 flex items-center gap-4 border-t border-slate-100">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=surfer${i}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Join <span className="text-slate-900">2,400+</span> Elite Raiders
              </p>
            </div>
          </div>

          {/* Checkout Card Side */}
          <div className="order-1 lg:order-2">
            <div className="bg-white border border-slate-200 rounded-[40px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-3/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-3/10 transition-all duration-700" />
              
              <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-slate-50 relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Membership Status</h2>
                    <p className="text-2xl font-black text-slate-900">Premium Raider</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex items-center justify-between py-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Access Period</span>
                    <span className="text-sm font-black text-slate-900">Monthly Mission</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Auto-Renewal</span>
                    <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                      Enabled <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-brand-3 uppercase tracking-widest">Investment</span>
                      <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">
                        R45<span className="text-sm font-bold text-slate-400 ml-1">/ mo</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-through mb-1">R120.00</p>
                      <span className="bg-green-500/10 text-green-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                        60% Off Early Bird
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <Lock className="w-4 h-4 text-red-500" />
                    <p className="text-red-600 text-xs font-bold leading-tight uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={cn(
                    "w-full py-5 px-8 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group/btn",
                    loading ? "opacity-50 cursor-not-allowed" : "hover:bg-black"
                  )}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      Synchronize PayPal
                    </>
                  )}
                </button>

                <div className="mt-8 flex items-center justify-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    SECURE RELAY
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    CANCEL ANYTIME
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
