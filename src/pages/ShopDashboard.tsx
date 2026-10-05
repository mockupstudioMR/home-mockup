import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "@/lib/requireUserId";
import { 
  Store, 
  Package, 
  LogOut,
  Send,
  CreditCard,
  Plus,
  Upload,
  Link,
  TrendingUp,
  Users,
  Loader2,
  Sparkles
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagination } from "@/hooks/usePagination";
import ProductPagination from "@/components/ProductPagination";

const ShopDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    type: "",
    style: "",
    price: "",
    source_url: "",
  });
  const [_isSubmitting, _setIsSubmitting] = useState(false);
  const [shopUrl, setShopUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState("");

  // Fetch business profile
  const { data: businessProfile } = useQuery({
    queryKey: ["shop-profile", user?.id],
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

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["shop-products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("*")
        .eq("shop_id", requireUserId(user?.id))
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch product matches
  const { data: matches } = useQuery({
    queryKey: ["shop-matches", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_matches")
        .select(`
          *,
          shop_products (*)
        `)
        .in("product_id", products?.map(p => p.id) || [])
        .order("match_score", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!products && products.length > 0,
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: typeof newProduct) => {
      const { data, error } = await supabase
        .from("shop_products")
        .insert({
          shop_id: user?.id,
          name: product.name,
          description: product.description,
          type: product.type,
          style: product.style,
          price: product.price ? parseFloat(product.price) : null,
          source_url: product.source_url || null,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      toast({
        title: "Product added!",
        description: "Your product is now visible to potential customers.",
      });
      setNewProduct({
        name: "",
        description: "",
        type: "",
        style: "",
        price: "",
        source_url: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.type) {
      toast({
        title: "Missing fields",
        description: "Please fill in product name and type.",
        variant: "destructive",
      });
      return;
    }
    addProductMutation.mutate(newProduct);
  };

  const handleScrapeShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopUrl.trim() || !user?.id) {
      toast({
        title: "Missing URL",
        description: "Please enter your shop URL.",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);
    setScrapeProgress("Mapping your website...");

    try {
      const response = await supabase.functions.invoke("scrape-shop", {
        body: {
          shopUrl: shopUrl.trim(),
          userId: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast({
          title: "Import successful!",
          description: response.data.message || `Imported ${response.data.products?.length || 0} products`,
        });
        queryClient.invalidateQueries({ queryKey: ["shop-products"] });
        setShopUrl("");
      } else {
        throw new Error(response.data?.error || "Import failed");
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
      setScrapeProgress("");
    }
  };

  const categories = [
    "sofa", "chair", "table", "bed", "storage", "lighting", "decor", "rug", "outdoor"
  ];

  const styles = [
    "modern-minimal", "bohemian-eclectic", "glam-luxe", "rustic-nature", 
    "mediterranean", "classic-historical"
  ];

  // Products Tab Content with Pagination
  const ProductsTabContent = ({ 
    productList, 
    loading 
  }: { 
    productList: any[] | undefined; 
    loading: boolean 
  }) => {
    const pagination = usePagination({
      totalItems: productList?.length || 0,
      itemsPerPage: 12,
    });

    const paginatedProducts = productList?.slice(pagination.startIndex, pagination.endIndex);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>
            Manage your furniture catalog ({productList?.length || 0} products)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : productList?.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first product to start matching with customers
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedProducts?.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold line-clamp-1 mb-2">{product.name}</h3>
                      
                      {product.source_url ? (
                        <a
                          href={product.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
                        >
                          <Link className="w-3 h-3" />
                          View product
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-3">No link available</p>
                      )}
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{(product as any).type}</Badge>
                        {product.price && (
                          <Badge variant="outline">
                            €{product.price}
                          </Badge>
                        )}
                      </div>

                      {/* AI Generated Tags & Description */}
                      {((product as any).ai_style_tags?.length > 0 || (product as any).ai_image_description) && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          {(product as any).ai_style_tags?.length > 0 && (
                            <>
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-primary" />
                                <span className="text-xs text-muted-foreground">AI Style Tags</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(product as any).ai_style_tags.slice(0, 3).map((tag: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                          
                          {(product as any).ai_image_description && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">AI Description</span>
                              <p className="text-xs text-foreground/80 line-clamp-2 mt-0.5">
                                {(product as any).ai_image_description}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <ProductPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageNumbers={pagination.pageNumbers}
                onPageChange={pagination.goToPage}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
              <Store className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {businessProfile?.business_name || "Shop Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">Manage products & reach customers</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-3xl font-bold">{products?.length || 0}</p>
                </div>
                <Package className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Matches</p>
                  <p className="text-3xl font-bold">{matches?.length || 0}</p>
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
                  <p className="text-3xl font-bold">0</p>
                </div>
                <Send className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-3xl font-bold">--%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credits
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductsTabContent 
              productList={products} 
              loading={productsLoading} 
            />
          </TabsContent>

          {/* Add Product Tab */}
          <TabsContent value="add">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Add Product Manually
                  </CardTitle>
                  <CardDescription>
                    Enter product details to add to your catalog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Modern Velvet Sofa"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your product..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type *</Label>
                        <Select
                          value={newProduct.type}
                          onValueChange={(v) => setNewProduct({ ...newProduct, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat} className="capitalize">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={newProduct.style}
                          onValueChange={(v) => setNewProduct({ ...newProduct, style: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {styles.map((style) => (
                              <SelectItem key={style} value={style} className="capitalize">
                                {style.replace(/-/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source_url">Product URL</Label>
                      <Input
                        id="source_url"
                        type="url"
                        placeholder="https://yoursite.com/product"
                        value={newProduct.source_url}
                        onChange={(e) => setNewProduct({ ...newProduct, source_url: e.target.value })}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={addProductMutation.isPending}
                    >
                      {addProductMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Import from Shop URL
                  </CardTitle>
                  <CardDescription>
                    Enter your shop or product URL and we'll automatically import your products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleScrapeShop} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shopUrl">Shop Website URL or Product URL</Label>
                      <Input
                        id="shopUrl"
                        type="url"
                        placeholder="https://yourshop.com"
                        value={shopUrl}
                        onChange={(e) => setShopUrl(e.target.value)}
                        disabled={isScraping}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll scan your website for product pages and extract all the details automatically
                      </p>
                    </div>

                    {isScraping && scrapeProgress && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {scrapeProgress}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isScraping || !shopUrl.trim()}
                    >
                      {isScraping ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing Products...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import All Products
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-medium mb-2">How it works:</h4>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>We scan your website for all product pages</li>
                      <li>AI extracts product details (name, price, category, images)</li>
                      <li>Products are automatically added to your catalog</li>
                      <li>Customers can discover your products through our matching system</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Product Matches</CardTitle>
                <CardDescription>
                  Users whose preferences match your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matches?.length === 0 || !matches ? (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No matches yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add products to start matching with potential customers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div>
                          <p className="font-medium">
                            {(match.shop_products as any)?.name || "Product"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Match score: {Math.round(match.match_score * 100)}%
                          </p>
                        </div>
                        <Button size="sm" disabled>
                          <Send className="w-4 h-4 mr-2" />
                          Send Offer
                        </Button>
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
                  Purchase credits to send personalized offers
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
                        <Button className="w-full" disabled>
                          Coming Soon
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
    </div>
  );
};

export default ShopDashboard;
