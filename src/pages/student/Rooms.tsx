import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BedDouble } from "lucide-react";

interface Room { id: string; room_number: string; block_name: string; floor: number; capacity: number; occupied_beds: number; room_type: string; gender: string; status: string; }

const StudentRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [block, setBlock] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  useEffect(() => {
    supabase.from("rooms").select("*").eq("status", "available").order("block_name").then(({ data }) => {
      setRooms(data ?? []);
      setLoading(false);
    });
  }, []);

  const blocks = Array.from(new Set(rooms.map((r) => r.block_name))).sort();
  const filtered = rooms.filter((r) => {
    if (block !== "all" && r.block_name !== block) return false;
    if (type !== "all" && r.room_type !== type) return false;
    if (search && !`${r.room_number} ${r.block_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <PageHeader title="Available rooms" description="Browse rooms with open beds across all blocks." />

      <div className="grid gap-3 md:grid-cols-3 mb-6">
        <Input placeholder="Search by block or room number…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={block} onValueChange={setBlock}>
          <SelectTrigger><SelectValue placeholder="Block" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All blocks</SelectItem>
            {blocks.map((b) => <SelectItem key={b} value={b}>Block {b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Room type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="double">Double</SelectItem>
            <SelectItem value="triple">Triple</SelectItem>
            <SelectItem value="quad">Quad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BedDouble} title="No rooms match your filters" description="Try clearing the filters or check back soon — wardens add rooms regularly." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elegant transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Block {r.block_name}</div>
                  <div className="font-serif text-2xl font-bold">Room {r.room_number}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Floor" value={String(r.floor)} />
                <Field label="Type" value={r.room_type} />
                <Field label="Beds" value={`${r.occupied_beds} / ${r.capacity}`} />
                <Field label="Gender" value={r.gender} />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium capitalize">{value}</div></div>
);

export default StudentRooms;
