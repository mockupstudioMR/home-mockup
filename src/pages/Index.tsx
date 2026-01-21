import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Home, Palette, Wand2, ImageIcon, LogOut, User } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/quiz");
    } else {
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const features = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Style Quiz",
      description: "Answer quick questions about your design preferences",
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: "Upload Photos",
      description: "Share your room photos or choose from inspiration",
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "AI Generation",
      description: "Get stunning AI-generated room designs",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Refine & Share",
      description: "Modify designs with text prompts and save your favorites",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/30 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">RoomCraft AI</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/gallery")}>
                <User className="w-4 h-4 mr-2" />
                My Gallery
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Interior Design
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Design Your Dream
            <span className="block text-primary">Room in Seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Take a quick style quiz, upload your room photos, and let AI create
            stunning personalized room designs you can refine with simple text prompts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            {user && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/gallery")}
                className="text-lg px-8"
              >
                View My Designs
              </Button>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto w-full px-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-colors"
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-muted-foreground">
        <p>Powered by AI • Create beautiful spaces effortlessly</p>
      </footer>
    </div>
  );
};

export default Index;
