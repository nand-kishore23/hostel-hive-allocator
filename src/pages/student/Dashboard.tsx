import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { BedDouble, ClipboardList, MessageSquareWarning, KeyRound, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Allocation = Pick<Tables<"allocations">, "id" | "allocated_at" | "status"> & {
  rooms: Pick<Tables<"rooms">, "room_number" | "block_name" | "floor" | "room_type"> | null;
};
type RequestRow = Pick<Tables<"allocation_requests">, "id" | "status" | "created_at" | "preferred_block">;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [openComplaints, setOpenComplaints] = useState(0);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: alloc }, { data: req }, { count }, { data: prof }] = await Promise.all([
        supabase.from("allocations").select("id,allocated_at,status,rooms(room_number,block_name,floor,room_type)").eq("student_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("allocation_requests").select("id,status,created_at,preferred_block").eq("student_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("student_id", user.id).neq("status", "resolved"),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      setAllocation(alloc);
      setRequest(req);
      setOpenComplaints(count ?? 0);
      setProfile(prof);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`}
        description="Here's a quick look at your hostel status."
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Room status" value={allocation ? "Allocated" : "Not allocated"} icon={KeyRound} tone={allocation ? "success" : "warning"} hint={allocation ? `Block ${allocation.rooms?.block_name} • Room ${allocation.rooms?.room_number}` : "Submit a request to get started"} />
          <StatCard label="Latest request" value={request ? request.status : "None yet"} icon={ClipboardList} tone={request?.status === "approved" ? "success" : "default"} hint={request ? new Date(request.created_at).toLocaleDateString() : undefined} />
          <StatCard label="Open complaints" value={openComplaints} icon={MessageSquareWarning} tone={openComplaints > 0 ? "warning" : "default"} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {/* Allocation */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold">Your room</h2>
            {allocation && <StatusBadge status={allocation.status} />}
          </div>
          {allocation ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted-foreground text-xs">Block</div><div className="font-medium">{allocation.rooms?.block_name}</div></div>
                <div><div className="text-muted-foreground text-xs">Room</div><div className="font-medium">{allocation.rooms?.room_number}</div></div>
                <div><div className="text-muted-foreground text-xs">Floor</div><div className="font-medium">{allocation.rooms?.floor}</div></div>
                <div><div className="text-muted-foreground text-xs">Type</div><div className="font-medium capitalize">{allocation.rooms?.room_type}</div></div>
              </div>
              <div className="text-xs text-muted-foreground pt-3 border-t border-border">Allocated on {new Date(allocation.allocated_at).toLocaleDateString()}</div>
            </div>
          ) : (
            <EmptyState icon={BedDouble} title="No room allocated yet" description="Submit a hostel allocation request and we'll match you with an available room." action={<Button asChild variant="hero" size="sm"><Link to="/my-request">Submit request</Link></Button>} />
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-serif text-xl font-semibold mb-4">Quick actions</h2>
          <div className="space-y-2">
            <QuickLink to="/rooms" label="Browse available rooms" />
            <QuickLink to="/my-request" label="View / submit allocation request" />
            <QuickLink to="/complaints" label="Raise a complaint" />
            <QuickLink to="/profile" label="Update your profile" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const QuickLink = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className="flex items-center justify-between rounded-lg border border-border bg-background hover:bg-accent-soft hover:border-accent/40 px-4 py-3 transition-colors group">
    <span className="text-sm font-medium">{label}</span>
    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
  </Link>
);

export default StudentDashboard;
