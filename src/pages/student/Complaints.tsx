import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageSquareWarning, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  subject: z.string().trim().min(3, "Subject is too short").max(120),
  message: z.string().trim().min(10, "Please describe the issue").max(1000),
});
type Form = z.infer<typeof schema>;

interface Complaint { id: string; subject: string; message: string; status: string; created_at: string; }

const StudentComplaints = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("complaints").select("*").eq("student_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const onSubmit = async (data: Form) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("complaints").insert({ student_id: user.id, ...data });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Complaint raised");
    reset();
    load();
  };

  return (
    <DashboardLayout>
      <PageHeader title="Complaints" description="Report issues with your room or hostel facilities." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 p-6 h-fit">
          <h2 className="font-serif text-xl font-semibold mb-4">Raise a complaint</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" {...register("subject")} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Details</Label>
              <Textarea id="message" rows={5} {...register("message")} />
              {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit complaint
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-3 space-y-3">
          <h2 className="font-serif text-xl font-semibold">Your complaint history</h2>
          {loading ? <Skeleton className="h-32" /> : items.length === 0 ? (
            <EmptyState icon={MessageSquareWarning} title="No complaints yet" description="When you raise one, it'll appear here." />
          ) : (
            items.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold">{c.subject}</h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm text-muted-foreground">{c.message}</p>
                <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{new Date(c.created_at).toLocaleString()}</div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentComplaints;
