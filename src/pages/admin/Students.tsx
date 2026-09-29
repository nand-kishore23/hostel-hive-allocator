import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, ShieldOff, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  course: string | null;
  year: number | null;
  gender: string;
  roomLabel?: string | null;
  isAdmin?: boolean;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [promoteTarget, setPromoteTarget] = useState<Student | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Student | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data: allRoles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
    if (rolesError) {
      toast.error(rolesError.message);
      setStudents([]);
      setLoading(false);
      return;
    }

    const studentIds = Array.from(new Set((allRoles ?? []).filter((r) => r.role === "student").map((r) => r.user_id)));
    const adminIds = new Set((allRoles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    if (studentIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const [{ data: profiles, error: profilesError }, { data: allocations, error: allocationsError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, course, year, gender").in("id", studentIds).order("full_name"),
      supabase.from("allocations").select("student_id, room_id, status").eq("status", "active").in("student_id", studentIds),
    ]);

    if (profilesError) toast.error(profilesError.message);
    if (allocationsError) toast.error(allocationsError.message);

    const roomIds = Array.from(new Set((allocations ?? []).map((allocation) => allocation.room_id)));
    let roomMap = new Map<string, string>();

    if (roomIds.length > 0) {
      const { data: rooms, error: roomsError } = await supabase.from("rooms").select("id, block_name, room_number").in("id", roomIds);
      if (roomsError) {
        toast.error(roomsError.message);
      } else {
        roomMap = new Map((rooms ?? []).map((room) => [room.id, `${room.block_name}-${room.room_number}`]));
      }
    }

    const activeAllocationByStudent = new Map((allocations ?? []).map((allocation) => [allocation.student_id, allocation]));
    setStudents(
      (profiles ?? []).map((profile) => ({
        ...profile,
        roomLabel: activeAllocationByStudent.get(profile.id)?.room_id ? roomMap.get(activeAllocationByStudent.get(profile.id)!.room_id) ?? null : null,
        isAdmin: adminIds.has(profile.id),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePromote = async () => {
    if (!promoteTarget) return;
    setPromoting(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: promoteTarget.id, role: "admin" });
    setPromoting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${promoteTarget.full_name} is now an admin`);
    setStudents((prev) => prev.map((s) => (s.id === promoteTarget.id ? { ...s, isAdmin: true } : s)));
    setPromoteTarget(null);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", revokeTarget.id)
      .eq("role", "admin");
    setRevoking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${revokeTarget.full_name} is no longer an admin`);
    setStudents((prev) => prev.map((s) => (s.id === revokeTarget.id ? { ...s, isAdmin: false } : s)));
    setRevokeTarget(null);
  };

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <PageHeader title="Students" description="All registered students and their current room allocation." />
      <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm mb-4" />

      {loading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description={search ? "Try a different search." : "Students will appear here once they sign up."} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {s.full_name}
                        {s.isAdmin && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.course ?? "—"}</TableCell>
                    <TableCell>{s.year ?? "—"}</TableCell>
                    <TableCell className="capitalize">{s.gender}</TableCell>
                    <TableCell>{s.phone ?? "—"}</TableCell>
                    <TableCell>{s.roomLabel ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell className="text-right">
                      {s.isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRevokeTarget(s)}
                          disabled={s.id === user?.id}
                        >
                          <ShieldOff className="h-4 w-4 mr-1" /> Revoke admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPromoteTarget(s)}
                          disabled={s.id === user?.id}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" /> Promote
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AlertDialog open={!!promoteTarget} onOpenChange={(open) => !open && setPromoteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to admin?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{promoteTarget?.full_name}</strong> ({promoteTarget?.email}) will gain full admin access — managing rooms, allocations, requests, and complaints.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={promoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={promoting}>
              {promoting ? "Promoting…" : "Yes, promote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{revokeTarget?.full_name}</strong> ({revokeTarget?.email}) will lose all admin privileges immediately. They will keep their student access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={revoking}>
              {revoking ? "Revoking…" : "Yes, revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminStudents;
