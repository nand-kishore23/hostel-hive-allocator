import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, BedDouble, ClipboardList, MessageSquareWarning, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, rooms: 0, vacant: 0, pending: 0, openComplaints: 0, allocated: 0 });

  useEffect(() => {
    const load = async () => {
      const [students, roomsAll, pending, complaints, allocated] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("rooms").select("capacity, occupied_beds, status"),
        supabase.from("allocation_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).neq("status", "resolved"),
        supabase.from("allocations").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);
      const rooms = roomsAll.data ?? [];
      const totalBeds = rooms.reduce((s, r) => s + r.capacity, 0);
      const occupied = rooms.reduce((s, r) => s + r.occupied_beds, 0);
      setStats({
        students: students.count ?? 0,
        rooms: rooms.length,
        vacant: totalBeds - occupied,
        pending: pending.count ?? 0,
        openComplaints: complaints.count ?? 0,
        allocated: allocated.count ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader title="Warden dashboard" description="Overview of hostel occupancy and pending tasks." />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total students" value={stats.students} icon={Users} tone="accent" />
          <StatCard label="Active allocations" value={stats.allocated} icon={KeyRound} tone="success" />
          <StatCard label="Total rooms" value={stats.rooms} icon={Building2} />
          <StatCard label="Vacant beds" value={stats.vacant} icon={BedDouble} tone="success" />
          <StatCard label="Pending requests" value={stats.pending} icon={ClipboardList} tone="warning" />
          <StatCard label="Open complaints" value={stats.openComplaints} icon={MessageSquareWarning} tone="warning" />
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickAction to="/admin/requests" title="Review requests" description="Approve or reject pending allocations" />
        <QuickAction to="/admin/rooms" title="Manage rooms" description="Add, edit or remove rooms" />
        <QuickAction to="/admin/complaints" title="Resolve complaints" description="Update status on student complaints" />
      </div>
    </DashboardLayout>
  );
};

const QuickAction = ({ to, title, description }: { to: string; title: string; description: string }) => (
  <Link to={to} className="rounded-xl border border-border bg-card p-5 hover:border-accent/40 hover:shadow-elegant transition-all group">
    <h3 className="font-serif text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </Link>
);

export default AdminDashboard;
