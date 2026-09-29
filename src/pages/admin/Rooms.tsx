import { type ReactNode, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Room = Pick<Tables<"rooms">, "id" | "room_number" | "block_name" | "floor" | "capacity" | "occupied_beds" | "room_type" | "gender" | "status">;
type RoomForm = Pick<TablesInsert<"rooms">, "room_number" | "block_name" | "floor" | "capacity" | "room_type" | "gender" | "status">;

const empty: RoomForm = { room_number: "", block_name: "", floor: 1, capacity: 2, room_type: "double", gender: "male", status: "available" };
const toRoomForm = (room: Room): RoomForm => ({
  room_number: room.room_number,
  block_name: room.block_name,
  floor: room.floor,
  capacity: room.capacity,
  room_type: room.room_type,
  gender: room.gender,
  status: room.status,
});

const AdminRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(empty);
  const [saving, setSaving] = useState(false);

  // Filters
  const [block, setBlock] = useState("all");
  const [floor, setFloor] = useState("all");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");

  const load = async () => {
    const { data } = await supabase.from("rooms").select("*").order("block_name").order("room_number");
    setRooms(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (r: Room) => { setEditing(r); setForm(toRoomForm(r)); setOpen(true); };

  const save = async () => {
    if (!form.room_number || !form.block_name) { toast.error("Room number and block are required"); return; }
    if (form.capacity < 1) { toast.error("Capacity must be at least 1"); return; }
    setSaving(true);
    const payload: RoomForm = {
      room_number: form.room_number.trim(),
      block_name: form.block_name.trim(),
      floor: Number(form.floor),
      capacity: Number(form.capacity),
      room_type: form.room_type,
      gender: form.gender,
      status: form.status,
    };
    const { error } = editing
      ? await supabase.from("rooms").update(payload).eq("id", editing.id)
      : await supabase.from("rooms").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Room updated" : "Room added");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Room deleted");
    load();
  };

  const blocks = Array.from(new Set(rooms.map((r) => r.block_name))).sort();
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort();
  const filtered = rooms.filter((r) =>
    (block === "all" || r.block_name === block) &&
    (floor === "all" || String(r.floor) === floor) &&
    (gender === "all" || r.gender === gender) &&
    (status === "all" || r.status === status)
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Rooms"
        description="Add, edit and manage hostel rooms."
        actions={<Button variant="hero" onClick={openNew}><Plus className="h-4 w-4" /> Add room</Button>}
      />

      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <Select value={block} onValueChange={setBlock}>
          <SelectTrigger><SelectValue placeholder="Block" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All blocks</SelectItem>
            {blocks.map((b) => <SelectItem key={b} value={b}>Block {b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={floor} onValueChange={setFloor}>
          <SelectTrigger><SelectValue placeholder="Floor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All floors</SelectItem>
            {floors.map((f) => <SelectItem key={f} value={String(f)}>Floor {f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No rooms found" description="Add your first room to start allocating." action={<Button variant="hero" onClick={openNew}><Plus className="h-4 w-4" /> Add room</Button>} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.block_name}</TableCell>
                    <TableCell>{r.room_number}</TableCell>
                    <TableCell>{r.floor}</TableCell>
                    <TableCell className="capitalize">{r.room_type}</TableCell>
                    <TableCell className="capitalize">{r.gender}</TableCell>
                    <TableCell>{r.occupied_beds} / {r.capacity}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone. Rooms with active allocations cannot be deleted.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit room" : "Add new room"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Block name"><Input value={form.block_name} onChange={(e) => setForm({ ...form, block_name: e.target.value })} /></Field>
            <Field label="Room number"><Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} /></Field>
            <Field label="Floor"><Input type="number" min={0} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></Field>
            <Field label="Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
            <Field label="Room type">
              <Select value={form.room_type} onValueChange={(v) => setForm({ ...form, room_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="triple">Triple</SelectItem>
                  <SelectItem value="quad">Quad</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status" className="col-span-2">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const Field = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <div className={`space-y-1.5 ${className ?? ""}`}><Label>{label}</Label>{children}</div>
);

export default AdminRooms;
