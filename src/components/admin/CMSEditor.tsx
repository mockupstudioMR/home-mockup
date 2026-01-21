import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, Image, Type } from "lucide-react";

type ContentType = "text" | "html" | "image_url";

interface CMSContent {
  id: string;
  key: string;
  value: string;
  content_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ContentFormData {
  key: string;
  value: string;
  content_type: ContentType;
}

const CMSEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<CMSContent | null>(null);
  const [formData, setFormData] = useState<ContentFormData>({
    key: "",
    value: "",
    content_type: "text",
  });

  // Fetch all CMS content
  const { data: contents, isLoading } = useQuery({
    queryKey: ["cms-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_content")
        .select("*")
        .order("key", { ascending: true });

      if (error) throw error;
      return data as CMSContent[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ContentFormData) => {
      const { error } = await supabase.from("cms_content").insert({
        key: data.key,
        value: data.value,
        content_type: data.content_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content"] });
      toast({ title: "Content created successfully" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error creating content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContentFormData }) => {
      const { error } = await supabase
        .from("cms_content")
        .update({
          key: data.key,
          value: data.value,
          content_type: data.content_type,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content"] });
      toast({ title: "Content updated successfully" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error updating content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cms_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content"] });
      toast({ title: "Content deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingContent(null);
    setFormData({ key: "", value: "", content_type: "text" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (content: CMSContent) => {
    setEditingContent(content);
    setFormData({
      key: content.key,
      value: content.value,
      content_type: content.content_type as ContentType,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContent(null);
    setFormData({ key: "", value: "", content_type: "text" });
  };

  const handleSubmit = () => {
    if (!formData.key.trim() || !formData.value.trim()) {
      toast({
        title: "Validation error",
        description: "Key and value are required",
        variant: "destructive",
      });
      return;
    }

    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "html":
        return <FileText className="w-4 h-4" />;
      case "image_url":
        return <Image className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const getContentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      html: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      image_url: "bg-green-500/10 text-green-600 border-green-500/20",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            Edit app text, labels, and visual content
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : contents?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No content entries yet</p>
            <p className="text-sm">Click "Add Content" to create your first entry</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents?.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-mono text-sm">{content.key}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getContentTypeBadge(content.content_type)}>
                      <span className="flex items-center gap-1">
                        {getContentTypeIcon(content.content_type)}
                        {content.content_type}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {content.content_type === "image_url" ? (
                      <a
                        href={content.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        View Image
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{content.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(content)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(content.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingContent ? "Edit Content" : "Add Content"}
              </DialogTitle>
              <DialogDescription>
                {editingContent
                  ? "Update the content entry below"
                  : "Create a new content entry for your app"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  placeholder="e.g., hero_title, footer_text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use snake_case for consistency (e.g., landing_hero_title)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, content_type: v as ContentType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="image_url">Image URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                {formData.content_type === "html" ? (
                  <Textarea
                    id="value"
                    placeholder="Enter HTML content..."
                    rows={6}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                  />
                ) : (
                  <Input
                    id="value"
                    placeholder={
                      formData.content_type === "image_url"
                        ? "https://example.com/image.png"
                        : "Enter text content..."
                    }
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : editingContent
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CMSEditor;
