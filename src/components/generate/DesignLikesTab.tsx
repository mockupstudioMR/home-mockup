import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Heart, Lock, Download, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface LikedDesign {
  id: string;
  image_url: string;
  created_at: string;
  is_locked: boolean;
  is_favorite: boolean;
  full_description: string | null;
}

interface DesignLikesTabProps {
  onSelectDesign?: (designId: string) => void;
}

const DesignLikesTab = ({ onSelectDesign }: DesignLikesTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [designs, setDesigns] = useState<LikedDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLikes();
    }
  }, [user]);

  const loadLikes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("generated_designs")
        .select("id, image_url, created_at, is_locked, is_favorite, full_description")
        .eq("user_id", user.id)
        .eq("is_favorite", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error("Error loading liked designs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (designId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await supabase
        .from("generated_designs")
        .update({ is_favorite: false })
        .eq("id", designId);
      
      setDesigns(prev => prev.filter(d => d.id !== designId));
      
      toast({
        title: "Removed from likes",
        description: "Design removed from your favorites",
      });
    } catch (error) {
      console.error("Error unliking design:", error);
    }
  };

  const handleDownload = async (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Downloaded",
        description: "Design saved to your device",
      });
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
          <p className="text-muted-foreground">
            Designs you mark as favorites will appear here for quick access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {designs.map((design) => (
        <Card
          key={design.id}
          className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => onSelectDesign?.(design.id)}
        >
          <div className="relative aspect-video overflow-hidden bg-muted">
            <img
              src={design.image_url}
              alt="Liked design"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 left-2">
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => handleUnlike(design.id, e)}
              >
                <Heart className="w-4 h-4 fill-current text-destructive" />
              </Button>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              {design.is_locked && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 bg-background/80 backdrop-blur-sm"
                onClick={(e) => handleDownload(design.image_url, e)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(design.created_at), { addSuffix: true })}
            </p>
            {design.full_description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {design.full_description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DesignLikesTab;
