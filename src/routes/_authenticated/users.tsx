import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { UserPlus, Trash2, Edit2, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly } from "@/components/layout/AdminOnly";
import { ErrorState, PageHeader } from "@/components/StateBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUser, setUserActive, setUserRole, deleteUser, updateUserEmail, updateUserPassword } from "@/lib/admin.functions";
import { errorMessage, formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/users")({
  component: () => (
    <AdminOnly>
      <UsersPage />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Users — Awaaz AI" },
      { name: "description", content: "Manage dashboard users and roles." },
      { property: "og:title", content: "Users — Awaaz AI" },
      { property: "og:description", content: "Manage dashboard users and roles." },
    ],
  }),
});

function UsersPage() {
  const qc = useQueryClient();
  const { profile: me } = useAuth();
  const [editingEmail, setEditingEmail] = useState<{ userId: string; currentEmail: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  const users = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [{ data: p, error }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (error) throw error;
      return (p ?? []).map((u) => ({
        ...u,
        role: r?.some((x) => x.user_id === u.id && x.role === "admin") ? "admin" : "viewer",
      }));
    },
  });
  const roleFn = useServerFn(setUserRole);
  const activeFn = useServerFn(setUserActive);
  const deleteFn = useServerFn(deleteUser);
  const updateEmailFn = useServerFn(updateUserEmail);
  const updatePasswordFn = useServerFn(updateUserPassword);
  const done = {
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  };
  const roleMut = useMutation({
    mutationFn: (d: { userId: string; role: "admin" | "viewer" }) => roleFn({ data: d }),
    ...done,
  });
  const activeMut = useMutation({
    mutationFn: (d: { userId: string; active: boolean }) => activeFn({ data: d }),
    ...done,
  });
  const deleteMut = useMutation({
    mutationFn: (d: { userId: string }) => deleteFn({ data: d }),
    onSuccess: () => {
      toast.success("User deleted successfully");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  });
  
  const updateEmailMut = useMutation({
    mutationFn: (d: { userId: string; email: string }) => updateEmailFn({ data: d }),
    onSuccess: () => {
      toast.success("Email updated successfully");
      setEditingEmail(null);
      setNewEmail("");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  });
  
  const updatePasswordMut = useMutation({
    mutationFn: (d: { userId: string; password: string }) => updatePasswordFn({ data: d }),
    onSuccess: () => {
      toast.success("Password updated successfully");
      setEditingPassword(null);
      setNewPassword("");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Who can access this dashboard."
        actions={<AddUser />}
      />
      <div className="rounded-xl border bg-card shadow-card">
        {users.isError ? (
          <ErrorState onRetry={() => users.refetch()} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>
                    {editingEmail?.userId === u.id ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-48"
                          placeholder="Enter new email"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (newEmail.trim()) {
                              updateEmailMut.mutate({ userId: u.id, email: newEmail.trim() });
                            }
                          }}
                          disabled={updateEmailMut.isPending || !newEmail.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEmail(null);
                            setNewEmail("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{u.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEmail({ userId: u.id, currentEmail: u.email });
                            setNewEmail(u.email);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="size-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) =>
                        roleMut.mutate({ userId: u.id, role: v as "admin" | "viewer" })
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{u.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(u.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {u.id !== me?.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (u.is_active && !confirm(`Deactivate ${u.email}?`)) return;
                              activeMut.mutate({ userId: u.id, active: !u.is_active });
                            }}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPassword(u.id);
                              setNewPassword("");
                            }}
                            title="Reset password"
                          >
                            <Key className="size-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (!confirm(`Are you sure you want to delete ${u.email}? This action cannot be undone.`)) return;
                              deleteMut.mutate({ userId: u.id });
                            }}
                            disabled={deleteMut.isPending}
                            title="Delete user"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={!!editingPassword} onOpenChange={() => setEditingPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (editingPassword && newPassword.trim()) {
                updatePasswordMut.mutate({ userId: editingPassword, password: newPassword.trim() });
              }
            }}
          >
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters required
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updatePasswordMut.isPending || newPassword.length < 8}>
                {updatePasswordMut.isPending ? "Updating..." : "Update Password"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingPassword(null);
                  setNewPassword("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddUser() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "viewer" as "admin" | "viewer",
  });
  const fn = useServerFn(createUser);
  const mut = useMutation({
    mutationFn: () => fn({ data: f }),
    onSuccess: () => {
      toast.success("User created");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" /> Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              required
              value={f.fullName}
              onChange={(e) => setF({ ...f, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              required
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Temporary password</Label>
            <Input
              required
              minLength={8}
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={f.role}
              onValueChange={(v) => setF({ ...f, role: v as "admin" | "viewer" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={mut.isPending}>
            Create user
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
