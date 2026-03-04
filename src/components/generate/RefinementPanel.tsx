import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, RefreshCw, Upload, X, Loader2, Palette, ArrowLeftRight, Plus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModificationType = "color_material" | "swap_item" | "add_remove" | "layout";

interface RefinementPanelProps {
  modificationInput: string;
  onModificationInputChange: (value: string) => void;
  onModify: (type: ModificationType) => void;
  onRegenerate: () => void;
  generating: boolean;
  referenceImageUrl?: string | null;
  onReferenceUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReference?: () => void;
  uploadingReference?: boolean;
}

const MODIFICATION_TYPES = [
  {
    type: "color_material" as ModificationType,
    label: "Color / Material",
    icon: Palette,
    placeholder: "Change sofa to blue velvet, make walls sage green...",
    description: "Change colors, fabrics, or materials — everything else stays identical",
  },
  {
    type: "swap_item" as ModificationType,
    label: "Swap Item",
    icon: ArrowLeftRight,
    placeholder: "Replace coffee table with round marble one...",
    description: "Replace one piece of furniture — layout and all other items preserved",
  },
  {
    type: "add_remove" as ModificationType,
    label: "Add / Remove",
    icon: Plus,
    placeholder: "Add a floor lamp in the corner, remove the rug...",
    description: "Add or remove items — everything else stays exactly where it is",
  },
  {
    type: "layout" as ModificationType,
    label: "Layout",
    icon: LayoutGrid,
    placeholder: "Move sofa to face the window, swap dining and living areas...",
    description: "Rearrange furniture positions — most flexible, least constrained",
  },
];

const RefinementPanel = ({
  modificationInput,
  onModificationInputChange,
  onModify,
  onRegenerate,
  generating,
  referenceImageUrl,
  onReferenceUpload,
  onRemoveReference,
  uploadingReference = false,
}: RefinementPanelProps) => {
  const [selectedType, setSelectedType] = useState<ModificationType>("color_material");

  const activeType = MODIFICATION_TYPES.find((t) => t.type === selectedType)!;

  return (
    <div className="space-y-4 pt-3 border-t border-border/50">
      <p className="text-sm font-medium">Refine your design</p>

      {/* Type selector chips */}
      <div className="flex flex-wrap gap-2">
        {MODIFICATION_TYPES.map((mt) => {
          const Icon = mt.icon;
          return (
            <button
              key={mt.type}
              onClick={() => setSelectedType(mt.type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                selectedType === mt.type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {mt.label}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground">{activeType.description}</p>

      {/* Reference Image Upload */}
      <div className="flex items-center gap-3">
        {referenceImageUrl ? (
          <div className="relative">
            <img
              src={referenceImageUrl}
              alt="Reference"
              className="w-16 h-16 object-cover rounded-lg border border-border"
            />
            <button
              onClick={onRemoveReference}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
            {uploadingReference ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">Add reference</span>
            <input
              type="file"
              accept="image/*"
              onChange={onReferenceUpload}
              className="hidden"
              disabled={uploadingReference}
            />
          </label>
        )}
        {referenceImageUrl && (
          <span className="text-xs text-muted-foreground">Reference image added</span>
        )}
      </div>

      {/* Input + buttons */}
      <div className="flex gap-2">
        <Input
          placeholder={activeType.placeholder}
          value={modificationInput}
          onChange={(e) => onModificationInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && modificationInput.trim() && onModify(selectedType)}
        />
        <Button
          onClick={() => onModify(selectedType)}
          disabled={!modificationInput.trim() || generating}
        >
          <Send className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={onRegenerate} disabled={generating}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default RefinementPanel;
