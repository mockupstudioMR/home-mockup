import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserRound, Pencil } from "lucide-react";

/**
 * Account dialog: lets the signed-in user view and change the name
 * stored on their profile (profiles.display_name).
 */
export const useProfileName = () => {
  const { user } = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setName(data?.display_name ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return name;
};

interface AccountNameDialogProps {
  /** Renders a compact icon-only trigger instead of the labeled one. */
  compact?: boolean;
  onSaved?: (name: string) => void;
}

const AccountNameDialog = ({ compact = false, onSaved }: AccountNameDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentName = useProfileName();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(currentName ?? "");
  }, [open, currentName]);

  const handleSave = async () => {
    if (!user) return;
    const trimmed = value.trim();
    if (!trimmed) {
      toast({
        title: "Please enter a name",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, email: user.email, display_name: trimmed },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      toast({ title: "Name updated" });
      onSaved?.(trimmed);
      setOpen(false);
    } catch (e) {
      toast({
        title: "Couldn't update name",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const label = currentName || user?.email || "Account";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="sm" className="gap-2" title="Account">
            <UserRound className="w-4 h-4" />
            <span className="hidden sm:inline max-w-40 truncate">{label}</span>
            <Pencil className="w-3 h-3 opacity-60" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <UserRound className="w-4 h-4" />
            <span className="max-w-40 truncate">{label}</span>
            <Pencil className="w-3 h-3 opacity-60" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Change the name used across your HomeMockUp experience.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="account-name">Your name</Label>
          <Input
            id="account-name"
            value={value}
            placeholder="e.g. Monica Riad"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saving) void handleSave();
            }}
          />
          {user?.email && (
            <p className="text-xs text-muted-foreground break-all">{user.email}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountNameDialog;
