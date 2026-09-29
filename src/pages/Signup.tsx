import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  course: z.string().trim().min(2, "Course is required").max(80),
  year: z.coerce.number().int().min(1).max(6),
  gender: z.enum(["male", "female", "other"]),
});
type Form = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormInput, unknown, Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: data.full_name,
          phone: data.phone,
          course: data.course,
          year: String(data.year),
          gender: data.gender,
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Welcome to Hostel Hive.");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex bg-hero text-primary-foreground relative overflow-hidden p-12">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,hsl(35_85%_55%),transparent_40%)]" />
        <div className="relative my-auto max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-12">
            <div className="h-10 w-10 rounded-lg bg-accent-gradient flex items-center justify-center font-serif font-bold text-accent-foreground">H</div>
            <span className="font-serif font-bold text-xl">HOSTEL HIVE</span>
          </Link>
          <h2 className="font-serif text-4xl font-bold leading-tight mb-4">Reserve your spot.</h2>
          <p className="text-primary-foreground/75">Tell us about you — once you're in, you can request a room and track everything from your dashboard.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8 shadow-elegant border-border/60">
          <Link to="/" className="md:hidden flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-lg bg-accent-gradient flex items-center justify-center font-serif font-bold text-accent-foreground">H</div>
            <span className="font-serif font-bold">HOSTEL HIVE</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold mb-1">Create student account</h1>
          <p className="text-sm text-muted-foreground mb-6">Wardens are added separately by the administrator.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" min={1} max={6} {...register("year")} />
                {errors.year && <p className="text-xs text-destructive">Required</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course">Course</Label>
              <Input id="course" placeholder="e.g. B.Tech Computer Science" {...register("course")} />
              {errors.course && <p className="text-xs text-destructive">{errors.course.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={watch("gender")} onValueChange={(value) => setValue("gender", value as FormInput["gender"], { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-destructive">Select an option</p>}
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
