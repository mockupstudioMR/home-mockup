import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface StyleMatch {
  style: string;
  percentage: number;
  color: string;
}

interface PersonalizedStyleProfileProps {
  styleMatches: StyleMatch[];
  profileName: string;
  profileDescription: string;
}

const styleDisplayNames: Record<string, string> = {
  "modern-minimal": "Modern Minimal",
  "classic-historical": "Classic & Historical",
  "bohemian-eclectic": "Bohemian & Eclectic",
  "rustic-nature": "Rustic & Natural",
  "mediterranean": "Mediterranean",
  "glam-luxe": "Glam & Luxe",
};

const PersonalizedStyleProfile = ({
  styleMatches,
  profileName,
  profileDescription,
}: PersonalizedStyleProfileProps) => {
  // Sort by percentage descending
  const sortedMatches = [...styleMatches].sort((a, b) => b.percentage - a.percentage);

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-card to-accent/5 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Profile info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{profileName}</h3>
                <p className="text-sm text-muted-foreground">Your unique style DNA</p>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {profileDescription}
            </p>

            <div className="flex flex-wrap gap-2">
              {sortedMatches.slice(0, 3).map((match) => (
                <Badge
                  key={match.style}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${match.color}20`,
                    borderColor: match.color,
                    borderWidth: 1,
                  }}
                >
                  {styleDisplayNames[match.style] || match.style}
                </Badge>
              ))}
            </div>
          </div>

          {/* Right: Visual percentage bars */}
          <div className="md:w-64 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Style Composition</p>
            {sortedMatches.map((match) => (
              <div key={match.style} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">
                    {styleDisplayNames[match.style] || match.style}
                  </span>
                  <span className="font-medium" style={{ color: match.color }}>
                    {match.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${match.percentage}%`,
                      backgroundColor: match.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizedStyleProfile;
