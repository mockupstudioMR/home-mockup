import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Palette, Plus, Shield, Store, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AddUserDialog from "./AddUserDialog";

type InviteRole = "designer" | "furniture_shop" | "admin";

const roleIcon = (role: string) => {
  switch (role) {
    case "designer": return <Palette className="h-4 w-4" />;
    case "furniture_shop": return <Store className="h-4 w-4" />;
    case "admin": return <Shield className="h-4 w-4" />;
    default: return <Users className="h-4 w-4" />;
  }
};

const roleBadge = (role: string) => {
  switch (role) {
    case "admin": return "bg-destructive/10 text-destructive border-destructive/20";
    case "designer": return "bg-primary/10 text-primary border-primary/20";
    case "furniture_shop": return "bg-accent/10 text-accent-foreground border-accent/20";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function UsersInvites() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [role, setRole] = useState<InviteRole>("designer");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_invites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const [{ data: roles, error }, { data: profiles }] = await Promise.all([
        supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, email, display_name").limit(5000),
      ]);
      if (error) throw error;
      const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (roles ?? []).map((r) => ({ ...r, profile: byUser.get(r.user_id) }));
    },
  });

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        u.user_id.includes(q) ||
        u.profile?.email?.toLowerCase().includes(q) ||
        u.profile?.display_name?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const createInvite = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("role_invites").insert({ role, email: email || null }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      navigator.clipboard.writeText(`${window.location.origin}/auth?invite=${data.token}`);
      toast({ title: "Invite created", description: "Invite link copied to clipboard." });
      setEmail("");
    },
    onError: () => toast({ title: "Error", description: "Failed to create invite", variant: "destructive" }),
  });

  const copy = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/auth?invite=${token}`);
    toast({ title: "Copied", description: "Invite link copied to clipboard." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Users &amp; invites</h2>
          <p className="mt-2 text-muted-foreground">Find people by email or name, and give out roles by invite.</p>
        </div>
        <AddUserDialog />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Users with a role</CardTitle>
            <Input aria-label="Search users" placeholder="Search by email or name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </CardHeader>
          <CardContent className="space-y-3">
            {shown.length === 0 && <p className="text-muted-foreground">No users found.</p>}
            {shown.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border bg-secondary/40 p-4">
                {roleIcon(u.role)}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{u.profile?.display_name || u.profile?.email || "No profile yet"}</p>
                  <p className="truncate text-sm text-muted-foreground">{u.profile?.email ?? u.user_id}</p>
                </div>
                <Badge variant="outline" className={roleBadge(u.role)}>{u.role.replace("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invite someone</CardTitle>
              <CardDescription>They get a link; the role is given when they accept.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email (optional)</Label>
                <Input id="invite-email" type="email" placeholder="partner@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="furniture_shop">Furniture shop</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => createInvite.mutate()} disabled={createInvite.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Create invite
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invites</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {invitesLoading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : (invites ?? []).length === 0 ? (
                <p className="text-muted-foreground">No invites yet</p>
              ) : (
                (invites ?? []).map((invite) => (
                  <div key={invite.id} className="flex items-center gap-3 rounded-xl border bg-secondary/40 p-3">
                    {roleIcon(invite.role)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold capitalize">{invite.role.replace("_", " ")} · {invite.status}</p>
                      {invite.email && <p className="truncate text-xs text-muted-foreground">{invite.email}</p>}
                    </div>
                    {invite.status === "pending" && (
                      <Button size="sm" variant="ghost" aria-label="Copy invite link" onClick={() => copy(invite.token)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
