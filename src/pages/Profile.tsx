import { type FormEvent, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Profile = Pick<Tables<"profiles">, "full_name" | "email" | "phone" | "course" | "year" | "gender">;
type ProfileUpdate = Pick<TablesUpdate<"profiles">, "full_name" | "phone" | "course" | "year" | "gender">;

const Profile = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,email,phone,course,year,gender").eq("id", user.id).maybeSingle().then(({ data, error }) => {
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!profile.full_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload: ProfileUpdate = {
      full_name: profile.full_name.trim(),
      phone: profile.phone?.trim() ? profile.phone.trim() : null,
      course: profile.course?.trim() ? profile.course.trim() : null,
      year: profile.year,
      gender: profile.gender,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  if (loading || !profile) return <DashboardLayout><div className="h-40 animate-pulse bg-muted rounded-xl" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="My profile" description={`Signed in as ${role}.`} />
      <Card className="p-6 max-w-2xl">
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input type="number" min={1} max={6} value={profile.year ?? ""} onChange={(e) => setProfile({ ...profile, year: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Input value={profile.course ?? ""} onChange={(e) => setProfile({ ...profile, course: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="hero" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </Button>
        </form>
      </Card>
    </DashboardLayout>
  );
};

export default Profile;
