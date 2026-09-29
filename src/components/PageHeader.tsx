import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => (
  <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8", className)}>
    <div>
      <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground mt-1.5 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warning";
}

export const StatCard = ({ label, value, icon: Icon, hint, tone = "default" }: StatCardProps) => {
  const tones = {
    default: "bg-secondary text-secondary-foreground",
    accent: "bg-accent-soft text-accent-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="font-serif text-3xl font-bold mt-2">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode }) => (
  <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-card/50">
    <div className="h-14 w-14 rounded-full bg-accent-soft text-accent-foreground inline-flex items-center justify-center mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="font-serif text-xl font-semibold mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{description}</p>}
    {action}
  </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    available: "bg-success/15 text-success border-success/30",
    full: "bg-destructive/10 text-destructive border-destructive/30",
    maintenance: "bg-warning/20 text-warning-foreground border-warning/40",
    pending: "bg-warning/20 text-warning-foreground border-warning/40",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
    active: "bg-success/15 text-success border-success/30",
    vacated: "bg-muted text-muted-foreground border-border",
    open: "bg-warning/20 text-warning-foreground border-warning/40",
    "in-progress": "bg-accent-soft text-accent-foreground border-accent/30",
    resolved: "bg-success/15 text-success border-success/30",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", map[status] ?? "bg-secondary text-secondary-foreground border-border")}>
      {status.replace("-", " ")}
    </span>
  );
};
