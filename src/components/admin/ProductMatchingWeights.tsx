import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SlidersHorizontal, RotateCcw, Save } from "lucide-react";

export interface MatchingWeights {
  fullNameMatch: number;
  nameFieldBonus: number;
  keywordBase: number;
  keywordPerMatch: number;
  keywordInNameBase: number;
  keywordInNamePer: number;
  categoryMatch: number;
  styleMatchDirect: number;
  styleMatchTag: number;
  colorMatch: number;
  materialMatch: number;
  minimumScore: number;
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  fullNameMatch: 50,
  nameFieldBonus: 30,
  keywordBase: 20,
  keywordPerMatch: 10,
  keywordInNameBase: 15,
  keywordInNamePer: 5,
  categoryMatch: 15,
  styleMatchDirect: 25,
  styleMatchTag: 20,
  colorMatch: 15,
  materialMatch: 15,
  minimumScore: 25,
};

const CMS_KEY = "product_matching_weights";

const WEIGHT_LABELS: Record<keyof MatchingWeights, { label: string; description: string; max: number }> = {
  fullNameMatch: { label: "Full Name Match", description: "Item name found anywhere in product text", max: 100 },
  nameFieldBonus: { label: "Name Field Bonus", description: "Extra points when match is in product name specifically", max: 80 },
  keywordBase: { label: "Keyword Base", description: "Base score for any keyword match", max: 60 },
  keywordPerMatch: { label: "Keyword Per Match", description: "Additional points per matched keyword", max: 30 },
  keywordInNameBase: { label: "Keyword in Name Base", description: "Base bonus when keywords match in product name", max: 50 },
  keywordInNamePer: { label: "Keyword in Name (per)", description: "Per-keyword bonus in product name", max: 20 },
  categoryMatch: { label: "Category Match", description: "Item type matches product category", max: 50 },
  styleMatchDirect: { label: "Style Match (direct)", description: "Direct style string overlap", max: 60 },
  styleMatchTag: { label: "Style Match (tag)", description: "Style found in AI style tags", max: 50 },
  colorMatch: { label: "Color Match", description: "Item color found in product text", max: 50 },
  materialMatch: { label: "Material Match", description: "Item material found in product text", max: 50 },
  minimumScore: { label: "Minimum Score Threshold", description: "Products below this score are filtered out", max: 100 },
};

const ProductMatchingWeights = () => {
  const [weights, setWeights] = useState<MatchingWeights>(DEFAULT_WEIGHTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeights = async () => {
      try {
        const { data } = await supabase
          .from("cms_content")
          .select("value")
          .eq("key", CMS_KEY)
          .eq("content_type", "config")
          .maybeSingle();

        if (data?.value) {
          setWeights({ ...DEFAULT_WEIGHTS, ...JSON.parse(data.value) });
        }
      } catch (err) {
        console.error("Failed to load weights:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeights();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("cms_content")
        .select("id")
        .eq("key", CMS_KEY)
        .eq("content_type", "config")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cms_content")
          .update({ value: JSON.stringify(weights) })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("cms_content")
          .insert({
            key: CMS_KEY,
            content_type: "config",
            value: JSON.stringify(weights),
          });
      }
      toast.success("Matching weights saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    toast.info("Reset to defaults (save to persist)");
  };

  const updateWeight = (key: keyof MatchingWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          Product Matching Weights
        </CardTitle>
        <CardDescription>
          Adjust how design items are scored against catalog products. Higher weights = stronger signal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5">
          {(Object.keys(WEIGHT_LABELS) as (keyof MatchingWeights)[]).map((key) => {
            const config = WEIGHT_LABELS[key];
            const isThreshold = key === "minimumScore";
            return (
              <div key={key} className={`space-y-2 ${isThreshold ? "pt-4 border-t border-border" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{config.label}</Label>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={weights[key]}
                      onChange={(e) => updateWeight(key, Math.max(0, Math.min(config.max, parseInt(e.target.value) || 0)))}
                      className="w-16 h-7 text-xs text-center"
                    />
                    <Badge variant="outline" className="text-[10px] w-8 justify-center">
                      {config.max}
                    </Badge>
                  </div>
                </div>
                <Slider
                  value={[weights[key]]}
                  onValueChange={([v]) => updateWeight(key, v)}
                  max={config.max}
                  min={0}
                  step={1}
                  className={isThreshold ? "[&_[role=slider]]:border-destructive [&_span:first-child>span]:bg-destructive" : ""}
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Weights"}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductMatchingWeights;
