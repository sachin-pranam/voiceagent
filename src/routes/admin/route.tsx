import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2, ShieldOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminRedirect,
});

function AdminRedirect() {
  const { session, profile, role, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!session) return <Navigate to="/login" />;
  
  if (!profile || !profile.is_active || role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldOff className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">
            Admin Access Required
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You need admin privileges to access this area. Contact an administrator if you think this is a mistake.
          </p>
          <Button variant="outline" className="mt-4" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  // Redirect admin users to the regular dashboard with admin features
  return <Navigate to="/dashboard" />;
}