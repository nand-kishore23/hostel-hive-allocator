import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});
type Form = z.infer<typeof schema>;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    // Role-based redirect handled by ProtectedRoute via dashboard route
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const isAdmin = roles?.some((r) => r.role === "admin");
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex bg-hero text-primary-foreground relative overflow-hidden p-12">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_40%)]" />
        <div className="relative my-auto max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-12">
            <div className="h-10 w-10 rounded-lg bg-accent-gradient flex items-center justify-center font-serif font-bold text-accent-foreground">H</div>
            <span className="font-serif font-bold text-xl">HOSTEL HIVE</span>
          </Link>
          <h2 className="font-serif text-4xl font-bold leading-tight mb-4">Welcome back to your hostel.</h2>
          <p className="text-primary-foreground/75">Sign in to manage your room, requests and complaints — all in one place.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8 shadow-elegant border-border/60">
          <Link to="/" className="md:hidden flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-lg bg-accent-gradient flex items-center justify-center font-serif font-bold text-accent-foreground">H</div>
            <span className="font-serif font-bold">HOSTEL HIVE</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">Use your hostel account credentials.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Don't have an account? <Link to="/signup" className="text-accent font-medium hover:underline">Sign up</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
