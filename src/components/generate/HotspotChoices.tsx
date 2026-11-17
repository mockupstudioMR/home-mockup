import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HOTSPOT_VISIBLE_LIMIT, ADDITIONAL_CHOICES_CREDITS, initialHotspotChoices, paidHotspotChoices, type HotspotOption, type HotspotContext } from "@/lib/homeMockup/hotspots";

type Props = {
  title: string;
  options: HotspotOption[];
  context: HotspotContext;
  unlockedOptionIds: string[];
  onSelect: (option: HotspotOption) => void;
  /** Server-authorized quote + entitlement; never debit credits in this component. */
  onUnlock: (candidateIds: string[]) => Promise<void>;
  creditBalance?: number;
};

export default function HotspotChoices({ title, options, context, unlockedOptionIds, onSelect, onUnlock, creditBalance }: Props) {
  const [batch, setBatch] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = useMemo(() => initialHotspotChoices(options, context), [options, context]);
  const additional = useMemo(
    () => paidHotspotChoices(options, context, [...unlockedOptionIds, ...initial.map(o => o.id)]),
    [options, context, unlockedOptionIds, initial],
  );
  const unlocked = options.filter(o => unlockedOptionIds.includes(o.id));
  const available = batch === 0 ? initial : unlocked.slice((batch - 1) * HOTSPOT_VISIBLE_LIMIT, batch * HOTSPOT_VISIBLE_LIMIT);
  const hasMore = additional.length > 0;

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      await onUnlock(additional.map(o => o.id));
      // Parent must refresh entitlements after successful server confirmation.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock choices");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label={`${title} alternatives`} className="rounded-2xl border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">Up to 5 at a time</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {available.map(option => (
          <button key={option.id} type="button" onClick={() => onSelect(option)}
            aria-pressed={context.currentOptionId === option.id}
            className="rounded-xl border p-2 text-left hover:border-primary aria-pressed:border-primary">
            <img src={option.imagePath} alt="" loading="lazy" className="w-full aspect-square object-contain rounded-lg" />
            <span className="text-xs">{option.id === context.currentOptionId ? "Current choice" : option.id}</span>
          </button>
        ))}
      </div>
      {unlocked.length > HOTSPOT_VISIBLE_LIMIT && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setBatch(0)}>Included</Button>
          {Array.from({ length: Math.ceil(unlocked.length / HOTSPOT_VISIBLE_LIMIT) }, (_, i) =>
            <Button key={i} variant="outline" size="sm" onClick={() => setBatch(i + 1)}>Unlocked {i + 1}</Button>)}
        </div>
      )}
      {hasMore && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">More personalized alternatives · {ADDITIONAL_CHOICES_CREDITS} credits</p>
          <Button disabled={busy || (creditBalance !== undefined && creditBalance < ADDITIONAL_CHOICES_CREDITS)} onClick={unlock}>
            {busy ? "Unlocking…" : "More options"}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
