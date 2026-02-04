import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit3, Lock, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DesignHistoryItem {
  id: string;
  image_url: string;
  prompt: string;
  created_at: string;
  is_locked: boolean;
  is_favorite: boolean;
  modification_history: string[] | null;
  full_description: string | null;
}

interface DesignHistoryTabProps {
  onSelectDesign?: (designId: string) => void;
}

const DesignHistoryTab = ({ onSelectDesign }: DesignHistoryTabProps) => {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<DesignHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("generated_designs")
        .select("id, image_url, prompt, created_at, is_locked, is_favorite, modification_history, full_description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setDesigns((data || []).map(d => ({
        ...d,
        modification_history: d.modification_history as string[] | null
      })));
    } catch (error) {
      console.error("Error loading design history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
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
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No designs yet</h3>
          <p className="text-muted-foreground">
            Your design history will appear here after you generate your first design.
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
              alt="Design"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              {design.is_locked && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(design.created_at), { addSuffix: true })}</span>
            </div>
            
            {design.modification_history && design.modification_history.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Edit3 className="w-3 h-3" />
                  <span>{design.modification_history.length} modification{design.modification_history.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {design.modification_history.slice(0, 3).map((mod, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs truncate max-w-[120px]">
                      {mod}
                    </Badge>
                  ))}
                  {design.modification_history.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{design.modification_history.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {design.full_description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {design.full_description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DesignHistoryTab;
