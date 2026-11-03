import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AudioLines, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createFirstAdmin, getSetupStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — Awaaz AI" },
      { name: "description", content: "Sign in to the Awaaz AI admin dashboard." },
      { property: "og:title", content: "Sign in — Awaaz AI" },
      { property: "og:description", content: "Sign in to the Awaaz AI admin dashboard." },
    ],
  }),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
const setupSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function LoginPage() {
  const { session, loading } = useAuth();
  const fetchSetup = useServerFn(getSetupStatus);
  const setup = useQuery({ queryKey: ["setup-status"], queryFn: () => fetchSetup() });

  if (!loading && session) return <Navigate to="/dashboard" />;

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 bg-login-gradient"
    >
      <div className="w-full max-w-sm">
        {/* Logo and Brand Name - Vertical Layout with White Background */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 p-6 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/30 shadow-xl">
            {/* Decorative background elements */}
            <div className="absolute top-2 right-2 w-20 h-20 bg-gray-100/50 rounded-full blur-xl"></div>
            <div className="absolute bottom-2 left-2 w-16 h-16 bg-primary/10 rounded-full blur-lg"></div>
            
            {/* Logo */}
            <div className="relative z-10">
              <img 
                src="/sunway-logo.webp" 
                alt="Awaaz AI Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow-lg">Awaaz AI</h1>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-card">
          {setup.data?.needsSetup ? <SetupForm onDone={() => setup.refetch()} /> : <LoginForm />}
        </div>
        <p className="mt-6 text-center text-xs text-white/80">
          Access is by invitation only. Contact your admin for an account.
        </p>
      </div>
    </div>
  );
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof loginSchema>>({ 
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(v);
    if (error) {
      const m = error.message.toLowerCase();
      setError(
        m.includes("banned")
          ? "Your account has been deactivated. Contact an admin."
          : m.includes("invalid")
            ? "Incorrect email or password."
            : "Sign in failed. Please try again.",
      );
    }
  });
  
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Enter your details to continue.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

function SetupForm({ onDone }: { onDone: () => void }) {
  const create = useServerFn(createFirstAdmin);
  const form = useForm<z.infer<typeof setupSchema>>({ resolver: zodResolver(setupSchema) });
  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await create({ data: v });
      const { error } = await supabase.auth.signInWithPassword({
        email: v.email,
        password: v.password,
      });
      if (error) throw error;
      toast.success("Admin account created");
      onDone();
    } catch (e) {
      toast.error(errorMessage(e, "Could not create admin account"));
    }
  });
  const errs = form.formState.errors;
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-semibold">Create the first admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No admin exists yet. This one-time step sets up your account.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...form.register("fullName")} />
        {errs.fullName && <p className="text-xs text-destructive">{errs.fullName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {errs.email && <p className="text-xs text-destructive">{errs.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} />
        {errs.password && <p className="text-xs text-destructive">{errs.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Create admin account
      </Button>
    </form>
  );
}
