import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BedDouble,
  FileText,
  MessageSquareWarning,
  User,
  LogOut,
  Users,
  ClipboardCheck,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const studentNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rooms", label: "Available Rooms", icon: BedDouble },
  { to: "/my-request", label: "My Request", icon: FileText },
  { to: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/rooms", label: "Rooms", icon: Building2 },
  { to: "/admin/requests", label: "Requests", icon: ClipboardCheck },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/profile", label: "Profile", icon: User },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = role === "admin" ? adminNav : studentNav;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-accent-gradient flex items-center justify-center font-serif text-lg font-bold text-accent-foreground">
          H
        </div>
        <div>
          <div className="font-serif font-bold leading-none">HOSTEL HIVE</div>
          <div className="text-xs opacity-70 mt-0.5 capitalize">{role} portal</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin" || item.to === "/dashboard"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/85"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs opacity-70 truncate mb-2">{user?.email}</div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-subtle">
      {/* Desktop sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0">{Sidebar}</div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-accent-gradient flex items-center justify-center font-serif font-bold text-accent-foreground text-sm">H</div>
          <span className="font-serif font-bold">HOSTEL HIVE</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-14">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">{Sidebar}</div>
        </div>
      )}

      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-10 max-w-7xl animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
