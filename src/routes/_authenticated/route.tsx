import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import {
  AudioLines,
  BookOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  PhoneCall,
  Settings,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const { session, profile, role, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;
  if (!profile || !profile.is_active || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldOff className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">
            {!profile ? "Account not set up" : "Account deactivated"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You don't have access to this dashboard. Contact an admin if you think this is a
            mistake.
          </p>
          <Button variant="outline" className="mt-4" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="flex items-center gap-3 h-full">
            <img 
              src="/sunway-logo.webp" 
              alt="Sunway Logo" 
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-xs text-muted-foreground">Developed By R2NS</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeSwitcher />
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8 relative bg-gradient-subtle">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { profile, role, signOut } = useAuth();
  const { pathname } = useLocation();
  const main = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/calls", label: "Calls", icon: PhoneCall },
  ] as const;
  const admin = [
    { to: "/users", label: "Users", icon: Users },
    { to: "/settings", label: "Settings", icon: Settings },
  ] as const;
  const initials = (profile?.full_name || profile?.email || "?").slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <AudioLines className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Awaaz AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((i) => (
                <SidebarMenuItem key={i.to}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(i.to)}>
                    <Link to={i.to}>
                      <i.icon />
                      <span>{i.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/call-transcripts")}>
                  <Link to="/call-transcripts">
                    <AudioLines className="size-4" />
                    <span>Call Transcripts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/faq")}>
                  <Link to="/faq">
                    <BookOpen className="size-4" />
                    <span>FAQ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {admin.map((i) => (
                  <SidebarMenuItem key={i.to}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(i.to)}>
                      <Link to={i.to}>
                        <i.icon />
                        <span>{i.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-lg border bg-card p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {profile?.full_name ?? profile?.email}
            </div>
            <span className="inline-block rounded bg-secondary px-1.5 text-[11px] font-medium capitalize text-secondary-foreground">
              {role}
            </span>
            {role === "admin" && (
              <span className="inline-block rounded bg-red-100 px-1.5 text-[10px] font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
                ADMIN
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={signOut}
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
