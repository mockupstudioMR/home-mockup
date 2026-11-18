import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "@/lib/requireUserId";
import { 
  Palette, 
  Users, 
  LogOut,
  Send,
  Eye,
  CreditCard,
  TrendingUp,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

const DesignerDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [roomFilter, setRoomFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);

  // Fetch business profile
  const { data: businessProfile } = useQuery({
    queryKey: ["designer-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", requireUserId(user?.id))
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch quiz responses to show potential clients
  const { data: quizResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ["designer-quiz-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_responses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch sent offers
  const { data: sentOffers } = useQuery({
    queryKey: ["designer-offers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("from_user_id", requireUserId(user?.id))
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredResponses = quizResponses?.filter(
    (response) =>
      (!q || response.style_preference.toLowerCase().includes(q) || response.room_type.toLowerCase().includes(q) || response.color_palette.toLowerCase().includes(q)) &&
      (!roomFilter || response.room_type === roomFilter) &&
      (!budgetFilter || response.budget_feel === budgetFilter),
  );
  const roomTypes = Array.from(new Set((quizResponses ?? []).map((r) => r.room_type))).sort();
  const budgets = Array.from(new Set((quizResponses ?? []).map((r) => r.budget_feel))).sort();
  const viewed = quizResponses?.find((r) => r.id === viewing);
  const label = (t: string) => t.replace(/[-_]/g, " ");
  const OFFERS_NEED_CREDITS = "Sending offers uses credits. Buying credits isn't switched on yet.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {businessProfile?.business_name || "Designer Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">Find clients & send offers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {businessProfile?.credits_balance || 0} credits
              </span>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Potential Clients</p>
                  <p className="text-3xl font-bold">{quizResponses?.length || 0}</p>
                </div>
                <Users className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offers Sent</p>
                  <p className="text-3xl font-bold">{sentOffers?.length || 0}</p>
                </div>
                <Send className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-3xl font-bold">--%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Find Clients
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              My Offers
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credits
            </TabsTrigger>
          </TabsList>

          {/* Find Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by style or room type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant={showFilters || roomFilter || budgetFilter ? "secondary" : "outline"} size="icon" aria-label="Filters" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            {showFilters && (
              <div className="flex flex-wrap items-center gap-3">
                <select aria-label="Room type" className="h-10 rounded-md border border-input bg-background px-3 text-sm capitalize" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
                  <option value="">All rooms</option>
                  {roomTypes.map((r) => (
                    <option key={r} value={r}>
                      {label(r)}
                    </option>
                  ))}
                </select>
                <select aria-label="Budget" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={budgetFilter} onChange={(e) => setBudgetFilter(e.target.value)}>
                  <option value="">Any budget</option>
                  {budgets.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {(roomFilter || budgetFilter) && (
                  <Button variant="ghost" size="sm" onClick={() => (setRoomFilter(""), setBudgetFilter(""))}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {responsesLoading ? (
              <p className="text-muted-foreground">Loading potential clients...</p>
            ) : filteredResponses?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No matching clients found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredResponses?.map((response) => (
                  <Card key={response.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="capitalize">
                              {response.room_type.replace(/-/g, " ")}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {response.style_preference.replace(/-/g, " ")}
                            </Badge>
                            <Badge variant="outline">
                              {response.budget_feel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Color palette: {response.color_palette}
                          </p>
                          {response.must_have_elements && response.must_have_elements.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Must have: {response.must_have_elements.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setViewing(response.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" disabled title={OFFERS_NEED_CREDITS}>
                            <Send className="w-4 h-4 mr-2" />
                            Send Offer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Offers Tab */}
          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>Sent Offers</CardTitle>
                <CardDescription>Track your offers and responses</CardDescription>
              </CardHeader>
              <CardContent>
                {sentOffers?.length === 0 ? (
                  <div className="py-12 text-center">
                    <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No offers sent yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Purchase credits to start sending personalized offers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentOffers?.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div>
                          <p className="font-medium">{offer.title}</p>
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            offer.status === "accepted"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : offer.status === "rejected"
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Credit Balance
                </CardTitle>
                <CardDescription>
                  Purchase credits to send offers to potential clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-4xl font-bold text-primary">
                    {businessProfile?.credits_balance || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">credits</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { credits: 10, price: 29 },
                    { credits: 25, price: 59, popular: true },
                    { credits: 50, price: 99 },
                  ].map((pkg) => (
                    <Card
                      key={pkg.credits}
                      className={pkg.popular ? "border-primary" : ""}
                    >
                      <CardContent className="pt-6 text-center">
                        {pkg.popular && (
                          <Badge className="mb-2">Most Popular</Badge>
                        )}
                        <p className="text-3xl font-bold">{pkg.credits}</p>
                        <p className="text-sm text-muted-foreground mb-4">credits</p>
                        <p className="text-lg font-semibold mb-4">${pkg.price}</p>
                        <Button className="w-full" disabled title="Buying credits isn't switched on yet">
                          Not available yet
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Dialog open={!!viewed} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewed && (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">
                  {label(viewed.style_preference)} {label(viewed.room_type)}
                </DialogTitle>
                <DialogDescription>Style brief from {new Date(viewed.created_at).toLocaleDateString()}.</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Room</dt>
                <dd className="capitalize">{label(viewed.room_type)}</dd>
                <dt className="text-muted-foreground">Style</dt>
                <dd className="capitalize">{label(viewed.style_preference)}</dd>
                <dt className="text-muted-foreground">Budget</dt>
                <dd>{viewed.budget_feel}</dd>
                <dt className="text-muted-foreground">Colours</dt>
                <dd>{viewed.color_palette}</dd>
                <dt className="text-muted-foreground">Must have</dt>
                <dd>{viewed.must_have_elements?.length ? viewed.must_have_elements.join(", ") : "—"}</dd>
                <dt className="text-muted-foreground">Furniture from</dt>
                <dd>{viewed.furniture_source ?? "—"}</dd>
              </dl>
              <p className="text-sm text-muted-foreground">{OFFERS_NEED_CREDITS}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignerDashboard;
