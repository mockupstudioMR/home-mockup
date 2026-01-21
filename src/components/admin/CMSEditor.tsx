import { useState, useCallback } from "react";
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
import { Plus, Pencil, Trash2, FileText, Image, Type, Upload, Loader2 } from "lucide-react";

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
  title: string;
}

const CMSEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<CMSContent | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<ContentFormData>({
    key: "",
    value: "",
    content_type: "text",
    title: "",
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

  // Image upload handler
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cms/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("cms-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("cms-assets")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, value: publicUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ContentFormData) => {
      const { error } = await supabase.from("cms_content").insert({
        key: data.key,
        value: data.value,
        content_type: data.content_type,
        metadata: { title: data.title },
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
    mutationFn: async ({ id, data, existingTitle }: { id: string; data: ContentFormData; existingTitle?: string }) => {
      const { error } = await supabase
        .from("cms_content")
        .update({
          key: data.key,
          value: data.value,
          content_type: data.content_type,
          metadata: { title: data.title || existingTitle || "" },
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
    setFormData({ key: "", value: "", content_type: "text", title: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (content: CMSContent) => {
    setEditingContent(content);
    setFormData({
      key: content.key,
      value: content.value,
      content_type: content.content_type as ContentType,
      title: "", // Leave empty so placeholder shows current value
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContent(null);
    setFormData({ key: "", value: "", content_type: "text", title: "" });
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
      updateMutation.mutate({ 
        id: editingContent.id, 
        data: formData, 
        existingTitle: (editingContent.metadata?.title as string) || "" 
      });
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
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents?.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-mono text-sm">{content.key}</TableCell>
                  <TableCell className="text-sm">
                    {(content.metadata?.title as string) || (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    placeholder="e.g., hero_title"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Use snake_case (e.g., landing_hero)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder={editingContent ? (editingContent.metadata?.title as string) || "Display title" : "Display title"}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={!formData.title && editingContent?.metadata?.title ? "placeholder:text-muted-foreground/70" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Human-readable name
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, content_type: v as ContentType, value: "" })
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
                ) : formData.content_type === "image_url" ? (
                  <div className="space-y-3">
                    <Input
                      id="value"
                      placeholder="https://example.com/image.png"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">or</span>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          asChild
                        >
                          <span>
                            {uploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {uploading ? "Uploading..." : "Upload Image"}
                          </span>
                        </Button>
                      </label>
                    </div>
                    {formData.value && formData.value.startsWith("http") && (
                      <div className="mt-2 rounded-md border overflow-hidden bg-muted/50">
                        <img
                          src={formData.value}
                          alt="Preview"
                          className="max-h-32 object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <Input
                    id="value"
                    placeholder="Enter text content..."
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
