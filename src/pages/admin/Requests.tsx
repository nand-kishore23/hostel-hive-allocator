import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClipboardCheck, Check, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface RequestRow {
  id: Tables<"allocation_requests">["id"];
  student_id: Tables<"allocation_requests">["student_id"];
  status: Tables<"allocation_requests">["status"];
  created_at: Tables<"allocation_requests">["created_at"];
  preferred_block: Tables<"allocation_requests">["preferred_block"];
  preferred_room_type: Tables<"allocation_requests">["preferred_room_type"];
  special_request: Tables<"allocation_requests">["special_request"];
  reviewed_at?: Tables<"allocation_requests">["reviewed_at"];
  profiles: Pick<Tables<"profiles">, "full_name" | "email" | "gender" | "course" | "year"> | null;
}
type Room = Pick<Tables<"rooms">, "id" | "room_number" | "block_name" | "floor" | "capacity" | "occupied_beds" | "room_type" | "gender" | "status">;

const AdminRequests = () => {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocOpen, setAllocOpen] = useState(false);
  const [active, setActive] = useState<RequestRow | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: requestRows, error: requestError } = await supabase
      .from("allocation_requests")
      .select("id, student_id, status, created_at, preferred_block, preferred_room_type, special_request, reviewed_at")
      .order("created_at", { ascending: false });

    if (requestError) {
      toast.error(requestError.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const studentIds = Array.from(new Set((requestRows ?? []).map((row) => row.student_id)));
    let profileMap = new Map<string, RequestRow["profiles"]>();

    if (studentIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, gender, course, year")
        .in("id", studentIds);

      if (profileError) {
        toast.error(profileError.message);
      } else {
        profileMap = new Map(
          (profiles ?? []).map((profile) => [
            profile.id,
            {
              full_name: profile.full_name,
              email: profile.email,
              gender: profile.gender,
              course: profile.course,
              year: profile.year,
            },
          ]),
        );
      }
    }

    setRequests(
      (requestRows ?? []).map((row) => ({
        ...row,
        profiles: profileMap.get(row.student_id) ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-requests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "allocation_requests" }, (payload) => {
        load();
        if (payload.eventType === "INSERT") toast.info("New allocation request received");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openApprove = async (req: RequestRow) => {
    setActive(req);
    setSelectedRoom("");

    let roomQuery = supabase.from("rooms").select("*").eq("status", "available");
    if (req.profiles?.gender) roomQuery = roomQuery.eq("gender", req.profiles.gender);

    const { data, error } = await roomQuery;
    if (error) {
      toast.error(error.message);
      return;
    }

    const candidates = [...(data ?? [])].sort((a, b) => {
      const score = (r: Room) => (r.block_name === req.preferred_block ? -2 : 0) + (r.room_type === req.preferred_room_type ? -1 : 0);
      return score(a) - score(b);
    });

    setRooms(candidates);
    if (candidates.length) setSelectedRoom(candidates[0].id);
    setAllocOpen(true);
  };

  const approve = async () => {
    if (!active || !selectedRoom) return;
    setProcessing(true);
    const { data: existing } = await supabase.from("allocations").select("id").eq("student_id", active.student_id).eq("status", "active").maybeSingle();
    if (existing) { toast.error("Student already has an active allocation"); setProcessing(false); return; }
    const { error: allocErr } = await supabase.from("allocations").insert({ student_id: active.student_id, room_id: selectedRoom, status: "active" });
    if (allocErr) { toast.error(allocErr.message); setProcessing(false); return; }
    const { error: requestError } = await supabase.from("allocation_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", active.id);
    if (requestError) { toast.error(requestError.message); setProcessing(false); return; }
    setProcessing(false);
    setAllocOpen(false);
    toast.success("Request approved & room allocated");
    load();
  };

  const reject = async (id: string) => {
    const { error } = await supabase.from("allocation_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Request rejected");
    load();
  };

  const renderList = (items: RequestRow[]) => items.length === 0 ? (
    <EmptyState icon={ClipboardCheck} title="Nothing here" description="No requests in this category." />
  ) : (
    <div className="space-y-3">
      {items.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold">{r.profiles?.full_name ?? "Unknown"}</h3>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-sm text-muted-foreground">{r.profiles?.email ?? "No email"} • {r.profiles?.course ?? "No course"} • Year {r.profiles?.year ?? "—"} • {r.profiles?.gender ?? "—"}</div>
              <div className="text-sm mt-2">
                <span className="text-muted-foreground">Preferred:</span> {r.preferred_block ? `Block ${r.preferred_block}` : "Any block"} • {r.preferred_room_type ?? "any type"}
              </div>
              {r.special_request && <p className="text-sm text-muted-foreground mt-2 italic">"{r.special_request}"</p>}
              <div className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button variant="success" size="sm" onClick={() => openApprove(r)}><Check className="h-4 w-4" /> Approve & allocate</Button>
                <Button variant="outline" size="sm" onClick={() => reject(r.id)}><X className="h-4 w-4" /> Reject</Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <DashboardLayout>
      <PageHeader title="Allocation requests" description="Review student requests, approve and assign a room." />

      {loading ? <Skeleton className="h-64" /> : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4">{renderList(pending)}</TabsContent>
          <TabsContent value="approved" className="mt-4">{renderList(approved)}</TabsContent>
          <TabsContent value="rejected" className="mt-4">{renderList(rejected)}</TabsContent>
        </Tabs>
      )}

      <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate room to {active?.profiles?.full_name ?? "student"}</DialogTitle></DialogHeader>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available rooms match this student's gender. Add or free up a room first.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Top of the list is the best match. You can override.</p>
              <div className="space-y-1.5">
                <Label>Choose room</Label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        Block {r.block_name} • Room {r.room_number} • Floor {r.floor} • {r.room_type} • {r.occupied_beds}/{r.capacity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAllocOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={approve} disabled={processing || !selectedRoom}>
              {processing && <Loader2 className="h-4 w-4 animate-spin" />} Confirm allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminRequests;
