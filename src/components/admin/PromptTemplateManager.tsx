import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PromptTemplate {
  id: string;
  template_key: string;
  template_label: string;
  template: string;
  description: string | null;
}

const AVAILABLE_VARIABLES: Record<string, { name: string; desc: string }[]> = {
  // Design generation templates
  default: [
    { name: "{{style}}", desc: "The mapped style preference (e.g. 'modern minimalist with clean lines')" },
    { name: "{{room}}", desc: "The room type label (e.g. 'living room')" },
    { name: "{{colors}}", desc: "The mapped color palette description" },
    { name: "{{budget}}", desc: "The mapped budget description (e.g. 'luxurious high-end designer')" },
    { name: "{{elements}}", desc: "User's must-have elements as a sentence" },
    { name: "{{product_instructions}}", desc: "Auto-generated product inclusion instructions" },
    { name: "{{furniture_list}}", desc: "Comma-separated furniture items for the room type" },
  ],
  modification: [
    { name: "{{modification_prompt}}", desc: "User's modification request text" },
    { name: "{{style}}", desc: "The mapped style preference" },
    { name: "{{colors}}", desc: "The mapped color palette description" },
    { name: "{{product_instructions}}", desc: "Auto-generated product inclusion instructions" },
  ],
  // Highlight visual templates
  highlight_color_palette: [
    { name: "{{style}}", desc: "Mapped style description (e.g. 'sleek modern minimalist')" },
    { name: "{{colors}}", desc: "Color list (e.g. 'terracotta, sage green, cream')" },
    { name: "{{materials}}", desc: "Material list (e.g. 'wood, fabric, stone, metal')" },
  ],
  highlight_accent_furniture: [
    { name: "{{style}}", desc: "Mapped style description" },
    { name: "{{room}}", desc: "Room type" },
    { name: "{{furnitureName}}", desc: "Name of the accent furniture piece" },
    { name: "{{furnitureDescription}}", desc: "Description of the furniture piece" },
  ],
  highlight_moodboard: [
    { name: "{{style}}", desc: "Mapped style description" },
    { name: "{{room}}", desc: "Room type" },
    { name: "{{elements}}", desc: "Design elements to include" },
  ],
  // Scrape shop template
  scrape_shop_extract: [
    { name: "{{scraped_content}}", desc: "Auto-injected scraped page content" },
  ],
  // Existing room redesign template
  existing_room_redesign: [
    { name: "{{style}}", desc: "The mapped style preference" },
    { name: "{{colors}}", desc: "The mapped color palette description" },
    { name: "{{budget}}", desc: "The mapped budget description" },
    { name: "{{elements}}", desc: "User's must-have elements" },
    { name: "{{product_instructions}}", desc: "Auto-generated product inclusion instructions" },
    { name: "{{furniture_list}}", desc: "Comma-separated furniture items for the room type" },
  ],
};

const getVariablesForTemplate = (templateKey: string) => {
  // Direct match
  if (AVAILABLE_VARIABLES[templateKey]) return AVAILABLE_VARIABLES[templateKey];
  // Design generation templates share variables
  if (["with_product_images", "with_source_image", "furniture_context"].includes(templateKey)) {
    return AVAILABLE_VARIABLES["default"];
  }
  // Analyze-style and extract templates have no variables
  return [];
};

const PromptTemplateManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PromptTemplate>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("template_key");
      if (error) throw error;
      return data as PromptTemplate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PromptTemplate>) => {
      const { error } = await supabase
        .from("prompt_templates")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      setEditingId(null);
      setEditData({});
      toast({ title: "Prompt template updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Prompt Templates</h3>
        <p className="text-sm text-muted-foreground">
          Customize the AI prompts used for design generation. Use variables in double curly braces.
        </p>
      </div>

      {/* Variable reference is now shown per-template */}

      {templates?.map((tpl) => {
        const isEditing = editingId === tpl.id;

        return (
          <Card key={tpl.id} className={isEditing ? "border-primary/30" : ""}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{tpl.template_label}</h4>
                    <Badge variant="outline" className="text-xs font-mono">{tpl.template_key}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{tpl.description}</p>
                </div>
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditData({}); }}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate({
                          id: tpl.id,
                          template: editData.template,
                          template_label: editData.template_label,
                          description: editData.description,
                        })}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(tpl.id); setEditData({ ...tpl }); }}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={editData.template_label || ""}
                        onChange={(e) => setEditData({ ...editData, template_label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={editData.description || ""}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Per-template variable hints */}
                  {(() => {
                    const vars = getVariablesForTemplate(tpl.template_key);
                    if (vars.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mr-1">Variables:</span>
                        <TooltipProvider>
                          {vars.map((v) => (
                            <Tooltip key={v.name}>
                              <TooltipTrigger>
                                <Badge variant="outline" className="font-mono text-xs cursor-help">
                                  {v.name}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{v.desc}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    );
                  })()}
                  <div className="space-y-1">
                    <Label className="text-xs">Prompt Template</Label>
                    <Textarea
                      value={editData.template || ""}
                      onChange={(e) => setEditData({ ...editData, template: e.target.value })}
                      className="min-h-[120px] font-mono text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-md p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {tpl.template}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PromptTemplateManager;
