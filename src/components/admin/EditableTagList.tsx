import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

interface EditableTagListProps {
  tags: string[];
  onUpdate: (tags: string[]) => void;
  isPending?: boolean;
}

const EditableTagList = ({ tags, onUpdate, isPending }: EditableTagListProps) => {
  const [newTag, setNewTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleRemove = (index: number) => {
    const updated = tags.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onUpdate([...tags, trimmed]);
      setNewTag("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewTag("");
    }
  };

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {tags.map((tag, i) => (
        <Badge
          key={i}
          variant="outline"
          className="text-xs bg-primary/5 pr-1 gap-1 group/tag"
        >
          {tag}
          <button
            onClick={() => handleRemove(i)}
            disabled={isPending}
            className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </Badge>
      ))}
      {isAdding ? (
        <Input
          autoFocus
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (!newTag.trim()) setIsAdding(false); }}
          placeholder="Type & Enter"
          className="h-6 w-24 text-xs px-2"
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default EditableTagList;
