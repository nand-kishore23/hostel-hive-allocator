import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ClipboardList, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  preferred_block: z.string().trim().max(50).optional().or(z.literal("")),
  preferred_room_type: z.enum(["single", "double", "triple", "quad"]).optional(),
  special_request: z.string().trim().max(500).optional().or(z.literal("")),
});
type Form = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;

type Req = Pick<Tables<"allocation_requests">, "id" | "status" | "created_at" | "preferred_block" | "preferred_room_type" | "special_request">;

const MyRequest = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormInput, unknown, Form>({ resolver: zodResolver(schema) });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("allocation_requests").select("*").eq("student_id", user.id).order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const hasPending = requests.some((r) => r.status === "pending");

  const onSubmit = async (data: Form) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("allocation_requests").insert({
      student_id: user.id,
      preferred_block: data.preferred_block || null,
      preferred_room_type: data.preferred_room_type || null,
      special_request: data.special_request || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request submitted!");
    reset();
    load();
  };

  return (
    <DashboardLayout>
      <PageHeader title="Allocation request" description="Submit your room preferences. A warden will review and approve." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 p-6 h-fit">
          <h2 className="font-serif text-xl font-semibold mb-1">New request</h2>
          <p className="text-sm text-muted-foreground mb-5">All fields are optional — leave blank for any preference.</p>
          {hasPending ? (
            <div className="text-sm bg-warning/10 text-warning-foreground border border-warning/30 rounded-lg p-3">
              You already have a pending request. Please wait for a warden to review it.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="preferred_block">Preferred block</Label>
                <Input id="preferred_block" placeholder="e.g. A" {...register("preferred_block")} />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred room type</Label>
                <Select value={watch("preferred_room_type")} onValueChange={(value) => setValue("preferred_room_type", value as FormInput["preferred_room_type"])}>
                  <SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                    <SelectItem value="quad">Quad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="special_request">Special request</Label>
                <Textarea id="special_request" rows={4} placeholder="Anything we should know?" {...register("special_request")} />
                {errors.special_request && <p className="text-xs text-destructive">{errors.special_request.message}</p>}
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit request
              </Button>
            </form>
          )}
        </Card>

        <div className="lg:col-span-3 space-y-3">
          <h2 className="font-serif text-xl font-semibold">Your request history</h2>
          {loading ? <Skeleton className="h-32" /> : requests.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No requests yet" description="Submit your first request to get a room." />
          ) : (
            requests.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                    <div className="font-medium mt-0.5">
                      {r.preferred_block ? `Block ${r.preferred_block}` : "Any block"} • {r.preferred_room_type ?? "any type"}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.special_request && <p className="text-sm text-muted-foreground border-t border-border pt-3">{r.special_request}</p>}
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyRequest;
