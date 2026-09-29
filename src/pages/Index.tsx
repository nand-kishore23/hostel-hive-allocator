import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BedDouble, ShieldCheck, Sparkles, ClipboardList, Building2, MessageSquareWarning } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: BedDouble, title: "Smart Allocation", text: "Request your room with preferences and track approval in real time." },
  { icon: Building2, title: "Live Room Inventory", text: "Browse availability across blocks, floors and types instantly." },
  { icon: ClipboardList, title: "Warden Workflow", text: "Approve requests, assign rooms and prevent over-allocation." },
  { icon: MessageSquareWarning, title: "Complaint Resolution", text: "Raise issues, track status, get them resolved transparently." },
  { icon: ShieldCheck, title: "Role-based Access", text: "Students see what they need. Wardens get full control." },
  { icon: Sparkles, title: "Built for Campuses", text: "Mobile-friendly, fast and designed for non-technical users." },
];

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [loading, user, role, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-accent-gradient flex items-center justify-center font-serif text-lg font-bold text-accent-foreground">H</div>
            <span className="font-serif font-bold text-lg tracking-tight">HOSTEL HIVE</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
            <Button asChild variant="hero"><Link to="/signup">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,hsl(35_85%_55%),transparent_45%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28 max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs backdrop-blur mb-6">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Smart Hostel Room Allocation System
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight max-w-3xl">
            Where every student finds <span className="text-accent">their place.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Hostel Hive brings room requests, allocations, and complaint resolution into one calm, modern dashboard for students and wardens alike.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg"><Link to="/signup">Create student account</Link></Button>
            <Button asChild variant="outlineLight" size="lg"><Link to="/login">Sign in</Link></Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="max-w-2xl mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">Everything a hostel office needs.</h2>
          <p className="mt-3 text-muted-foreground">From the first request to the last resolved complaint — all in one place.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elegant transition-all">
              <div className="h-11 w-11 rounded-lg bg-accent-soft text-accent-foreground flex items-center justify-center mb-4 group-hover:bg-accent-gradient transition-colors">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24 max-w-5xl">
        <div className="rounded-2xl bg-hero text-primary-foreground p-10 md:p-14 shadow-elegant text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">Ready to move in?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">Sign up as a student to request your room. Wardens can be added by the hostel administrator.</p>
          <Button asChild variant="accent" size="lg"><Link to="/signup">Get started — it's free</Link></Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Hostel Hive. Built for residential life.
      </footer>
    </div>
  );
};

export default Index;
