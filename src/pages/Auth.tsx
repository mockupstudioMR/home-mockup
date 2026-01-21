import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Home, Sparkles, Ticket, Loader2 } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  
  const [isLogin, setIsLogin] = useState(!inviteToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  
  const { user, role, signIn, signUp, acceptInvite } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle post-auth invite acceptance
  useEffect(() => {
    const handleInviteAcceptance = async () => {
      if (user && inviteToken && !acceptingInvite) {
        setAcceptingInvite(true);
        const result = await acceptInvite(inviteToken);
        
        if (result.success) {
          toast({
            title: "Invite accepted!",
            description: "Your account has been upgraded. Redirecting...",
          });
        } else {
          toast({
            title: "Invite Error",
            description: result.error,
            variant: "destructive",
          });
        }
        setAcceptingInvite(false);
      }
    };

    handleInviteAcceptance();
  }, [user, inviteToken]);

  // Redirect based on role after login
  useEffect(() => {
    if (user && role && !acceptingInvite) {
      const roleRedirects: Record<string, string> = {
        admin: "/admin",
        designer: "/designer",
        furniture_shop: "/shop",
        user: "/start",
      };
      navigate(roleRedirects[role] || "/start");
    }
  }, [user, role, acceptingInvite, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isLogin ? "Welcome back!" : "Account created!",
          description: inviteToken 
            ? "Processing your invite..."
            : "Let's design your dream space.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (acceptingInvite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Processing your invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            {inviteToken ? (
              <Ticket className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Home className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {inviteToken 
                ? "Accept Invitation" 
                : isLogin 
                  ? "Welcome Back" 
                  : "Create Account"}
            </CardTitle>
            <CardDescription className="mt-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {inviteToken 
                ? "Create an account to join as a partner"
                : "AI-Powered Interior Design"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {!inviteToken && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          )}

          {inviteToken && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-primary hover:underline font-medium"
              >
                Sign in instead
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
