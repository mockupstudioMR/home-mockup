import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GitBranch, RotateCcw, Save, Plus, X, Trash2 } from "lucide-react";

const CMS_KEY = "strict_type_families";

const DEFAULT_FAMILIES: Record<string, string[]> = {
  sofa: ["sofa", "couch", "settee", "modulsofa", "sofaserie"],
  bed: ["bed", "bett", "mattress", "headboard", "footboard"],
  coffee_table: ["coffee table", "couchtisch", "cocktail table"],
  dining_table: ["dining table", "esstisch"],
  side_table: ["side table", "end table", "beistelltisch", "accent table", "nightstand", "nesting table"],
  console_table: ["console table", "konsolentisch"],
  desk: ["desk", "schreibtisch"],
  table: ["table", "tisch"],
  chair: ["chair", "stuhl", "sessel", "armchair", "fauteuil", "stool", "bench", "dining chair", "lounge chair"],
  storage: ["wardrobe", "closet", "schrank", "cabinet", "sideboard", "kommode", "dresser", "bookshelf", "shelf", "regal", "vitrine"],
  lighting: ["lamp", "lampe", "leuchte", "chandelier", "sconce", "pendant", "light", "floor lamp", "table lamp", "desk lamp", "stehlampe"],
  rug: ["rug", "teppich", "carpet"],
  textile: ["curtain", "vorhang", "drape", "cushion", "pillow", "blanket", "throw"],
  decor: ["mirror", "spiegel", "vase", "planter", "artwork", "painting", "sculpture", "clock", "tray", "bowl", "frame"],
};

const TypeFamiliesManager = () => {
  const [families, setFamilies] = useState<Record<string, string[]>>(DEFAULT_FAMILIES);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newKeywordInputs, setNewKeywordInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("cms_content")
          .select("value")
          .eq("key", CMS_KEY)
          .eq("content_type", "config")
          .maybeSingle();
        if (data?.value) {
          setFamilies({ ...DEFAULT_FAMILIES, ...JSON.parse(data.value) });
        }
      } catch (err) {
        console.error("Failed to load type families:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
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
          .update({ value: JSON.stringify(families) })
          .eq("id", existing.id);
      } else {
        await supabase.from("cms_content").insert({
          key: CMS_KEY,
          content_type: "config",
          value: JSON.stringify(families),
        });
      }
      toast.success("Type families saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFamilies(DEFAULT_FAMILIES);
    toast.info("Reset to defaults (save to persist)");
  };

  const addKeyword = (family: string) => {
    const kw = (newKeywordInputs[family] || "").trim().toLowerCase();
    if (!kw) return;
    if (families[family]?.includes(kw)) {
      toast.error("Keyword already exists");
      return;
    }
    setFamilies((prev) => ({
      ...prev,
      [family]: [...(prev[family] || []), kw],
    }));
    setNewKeywordInputs((prev) => ({ ...prev, [family]: "" }));
  };

  const removeKeyword = (family: string, keyword: string) => {
    setFamilies((prev) => ({
      ...prev,
      [family]: prev[family].filter((k) => k !== keyword),
    }));
  };

  const addFamily = () => {
    const name = newFamilyName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) return;
    if (families[name]) {
      toast.error("Family already exists");
      return;
    }
    setFamilies((prev) => ({ ...prev, [name]: [] }));
    setNewFamilyName("");
  };

  const removeFamily = (family: string) => {
    setFamilies((prev) => {
      const next = { ...prev };
      delete next[family];
      return next;
    });
  };

  if (loading) return null;

  const sortedFamilies = Object.entries(families).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Product Type Families
        </CardTitle>
        <CardDescription>
          Control how design items are matched to product types. A "coffee table" will only match products in the coffee_table family, not dining_table.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedFamilies.map(([family, keywords]) => (
          <div key={family} className="space-y-2 p-3 rounded-lg border border-border bg-secondary/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold capitalize">
                {family.replace(/_/g, " ")}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={() => removeFamily(family)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {keywords.map((kw) => (
                <Badge
                  key={kw}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/20 gap-1"
                  onClick={() => removeKeyword(family, kw)}
                >
                  {kw}
                  <X className="w-2.5 h-2.5" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword..."
                value={newKeywordInputs[family] || ""}
                onChange={(e) =>
                  setNewKeywordInputs((prev) => ({ ...prev, [family]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && addKeyword(family)}
                className="h-7 text-xs"
              />
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addKeyword(family)}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            placeholder="New family name (e.g. outdoor_table)"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFamily()}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={addFamily}>
            <Plus className="w-4 h-4 mr-1" />
            Add Family
          </Button>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Type Families"}
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

export default TypeFamiliesManager;
