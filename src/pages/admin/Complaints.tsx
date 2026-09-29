import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MessageSquareWarning } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Complaint = Pick<Tables<"complaints">, "id" | "subject" | "message" | "status" | "created_at" | "student_id"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "email"> | null;
};

const AdminComplaints = () => {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: complaints, error: complaintsError } = await supabase
      .from("complaints")
      .select("id, subject, message, status, created_at, student_id")
      .order("created_at", { ascending: false });

    if (complaintsError) {
      toast.error(complaintsError.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const studentIds = Array.from(new Set((complaints ?? []).map((item) => item.student_id)));
    let profileMap = new Map<string, Complaint["profiles"]>();

    if (studentIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, full_name, email").in("id", studentIds);
      if (profilesError) {
        toast.error(profilesError.message);
      } else {
        profileMap = new Map((profiles ?? []).map((profile) => [profile.id, { full_name: profile.full_name, email: profile.email }]));
      }
    }

    setItems((complaints ?? []).map((item) => ({ ...item, profiles: profileMap.get(item.student_id) ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-complaints-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, (payload) => {
        load();
        if (payload.eventType === "INSERT") toast.info("New complaint received");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: Enums<"complaint_status">) => {
    const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status updated");
    load();
  };

  const renderList = (list: Complaint[]) => list.length === 0 ? (
    <EmptyState icon={MessageSquareWarning} title="Nothing here" description="No complaints in this category." />
  ) : (
    <div className="space-y-3">
      {list.map((c) => (
        <Card key={c.id} className="p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="font-semibold">{c.subject}</h3>
                <StatusBadge status={c.status} />
              </div>
              <div className="text-xs text-muted-foreground mb-2">{c.profiles?.full_name ?? "Unknown"} • {c.profiles?.email ?? "No email"} • {new Date(c.created_at).toLocaleString()}</div>
              <p className="text-sm">{c.message}</p>
            </div>
            <Select value={c.status} onValueChange={(value) => updateStatus(c.id, value as Enums<"complaint_status">)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      ))}
    </div>
  );

  const open = items.filter((c) => c.status === "open");
  const inprog = items.filter((c) => c.status === "in-progress");
  const done = items.filter((c) => c.status === "resolved");

  return (
    <DashboardLayout>
      <PageHeader title="Complaints" description="Review and resolve student complaints." />
      {loading ? <Skeleton className="h-64" /> : (
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
            <TabsTrigger value="inprog">In progress ({inprog.length})</TabsTrigger>
            <TabsTrigger value="done">Resolved ({done.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-4">{renderList(open)}</TabsContent>
          <TabsContent value="inprog" className="mt-4">{renderList(inprog)}</TabsContent>
          <TabsContent value="done" className="mt-4">{renderList(done)}</TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
};

export default AdminComplaints;
