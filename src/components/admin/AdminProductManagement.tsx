import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, 
  Plus, 
  Upload, 
  Link, 
  Loader2, 
  Sparkles,
  Store,
  ExternalLink,
  Trash2,
  Pencil,
  Check,
  Palette
} from "lucide-react";
import EditableTagList from "./EditableTagList";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const categories = [
  "sofa", "chair", "table", "bed", "sideboard", "lighting", "decor", "rug", "outdoor"
];

const styles = [
  "modern-minimal", "bohemian-eclectic", "glam-luxe", "rustic-nature", 
  "mediterranean", "classic-historical"
];

const AdminProductManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    style: "",
    price: "",
    source_url: "",
  });

  // Inline editing state
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{
    name: string;
    category: string;
    style: string;
    price: string;
    source_url: string;
  }>({ name: "", category: "", style: "", price: "", source_url: "" });
  const [shopUrl, setShopUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState("");

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");

  // Fetch all products
  const { data: allProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-all-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch business profiles for shop names
  const { data: businessProfiles } = useQuery({
    queryKey: ["admin-business-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("user_id, business_name");
      
      if (error) throw error;
      return data;
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: typeof newProduct & { shop_id: string }) => {
      const { data, error } = await supabase
        .from("shop_products")
        .insert({
          shop_id: product.shop_id,
          name: product.name,
          description: product.description,
          category: product.category,
          style: product.style,
          price: product.price ? parseFloat(product.price) : null,
          source_url: product.source_url || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-products"] });
      toast({
        title: "Product added!",
        description: "Product has been added to the shop's catalog.",
      });
      setNewProduct({
        name: "",
        description: "",
        category: "",
        style: "",
        price: "",
        source_url: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("shop_products")
        .delete()
        .eq("id", productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-products"] });
      toast({ title: "Product deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    },
  });

  // Update product tags mutation
  const updateTagsMutation = useMutation({
    mutationFn: async ({ productId, tags }: { productId: string; tags: string[] }) => {
      const { error } = await supabase
        .from("shop_products")
        .update({ ai_style_tags: tags })
        .eq("id", productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-products"] });
      toast({ title: "Tags updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update tags.", variant: "destructive" });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: { name?: string; category?: string; style?: string; price?: number | null; source_url?: string | null } }) => {
      const { error } = await supabase
        .from("shop_products")
        .update(updates)
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-products"] });
      toast({ title: "Product updated" });
      setEditingProduct(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    },
  });

  // Extract colors mutation
  const [extractingColorFor, setExtractingColorFor] = useState<string | null>(null);
  const extractColorsMutation = useMutation({
    mutationFn: async ({ productId, imageUrl }: { productId: string; imageUrl: string }) => {
      setExtractingColorFor(productId);
      const response = await supabase.functions.invoke("extract-product-colors", {
        body: { productId, imageUrl },
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Failed");
      return response.data.colors;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-products"] });
      toast({ title: "Colors extracted!" });
      setExtractingColorFor(null);
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to extract colors.", variant: "destructive" });
      setExtractingColorFor(null);
    },
  });

  const startEditing = (product: any) => {
    setEditingProduct(product.id);
    setEditFields({
      name: product.name || "",
      category: product.category || "",
      style: product.style || "",
      price: product.price ? String(product.price) : "",
      source_url: product.source_url || "",
    });
  };

  const saveEditing = (productId: string) => {
    updateProductMutation.mutate({
      productId,
      updates: {
        name: editFields.name,
        category: editFields.category,
        style: editFields.style || null,
        price: editFields.price ? parseFloat(editFields.price) : null,
        source_url: editFields.source_url || null,
      },
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in product name and category.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedShopId) {
      toast({
        title: "No shop selected",
        description: "Please select a shop to add the product to.",
        variant: "destructive",
      });
      return;
    }
    addProductMutation.mutate({ ...newProduct, shop_id: selectedShopId });
  };

  const handleScrapeShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a shop URL.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedShopId) {
      toast({
        title: "No shop selected",
        description: "Please select a shop to import products into.",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);
    setScrapeProgress("Mapping the website...");

    try {
      const response = await supabase.functions.invoke("scrape-shop", {
        body: {
          shopUrl: shopUrl.trim(),
          userId: selectedShopId,
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
        queryClient.invalidateQueries({ queryKey: ["admin-all-products"] });
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

  const getShopName = (shopId: string) => {
    const profile = businessProfiles?.find(p => p.user_id === shopId);
    return profile?.business_name || "Unknown Shop";
  };

  // Collect unique colors from all products for the filter dropdown
  const availableColors = Array.from(
    new Set(
      (allProducts || []).flatMap((p) => {
        const colors = (p.metadata as any)?.extracted_colors as Array<{ name: string }> | undefined;
        return colors?.map((c) => c.name) || [];
      })
    )
  ).sort();

  // Apply filters
  const filteredProducts = (allProducts || []).filter((p) => {
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterStyle !== "all" && p.style !== filterStyle) return false;
    if (filterColor !== "all") {
      const colors = (p.metadata as any)?.extracted_colors as Array<{ name: string }> | undefined;
      if (!colors?.some((c) => c.name === filterColor)) return false;
    }
    return true;
  });

  const pagination = usePagination({
    totalItems: filteredProducts.length,
    itemsPerPage: 12,
  });

  const paginatedProducts = filteredProducts.slice(pagination.startIndex, pagination.endIndex);

  return (
    <div className="space-y-6">
      {/* Add Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Add */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Add Product Manually
            </CardTitle>
            <CardDescription>
              Enter product details to add to a shop's catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop">Select Shop *</Label>
                <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessProfiles?.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Type *</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select
                    value={newProduct.style}
                    onValueChange={(v) => setNewProduct({ ...newProduct, style: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
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
                    placeholder="https://..."
                    value={newProduct.source_url}
                    onChange={(e) => setNewProduct({ ...newProduct, source_url: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={addProductMutation.isPending}
              >
                {addProductMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Product
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* URL Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Import from URL
            </CardTitle>
            <CardDescription>
              Automatically import products from a shop website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScrapeShop} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-shop">Select Shop *</Label>
                <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessProfiles?.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopUrl">Shop or Product URL</Label>
                <Input
                  id="shopUrl"
                  type="url"
                  placeholder="https://example.com/products"
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a shop homepage or product page URL to import products
                </p>
              </div>

              {scrapeProgress && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-primary">{scrapeProgress}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={isScraping}
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Products
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            All Products
          </CardTitle>
          <CardDescription>
            View and manage all products across all shops ({filteredProducts.length} of {allProducts?.length || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); pagination.goToPage(1); }}>
                <SelectTrigger className="w-[150px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Style</Label>
              <Select value={filterStyle} onValueChange={(v) => { setFilterStyle(v); pagination.goToPage(1); }}>
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  {styles.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <Select value={filterColor} onValueChange={(v) => { setFilterColor(v); pagination.goToPage(1); }}>
                <SelectTrigger className="w-[150px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {availableColors.map((color) => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterCategory !== "all" || filterStyle !== "all" || filterColor !== "all") && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { setFilterCategory("all"); setFilterStyle("all"); setFilterColor("all"); pagination.goToPage(1); }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : allProducts?.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products in the system</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedProducts?.map((product) => (
                  <Card key={product.id} className="overflow-hidden group">
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
                      {/* Shop badge overlay */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-background/90 text-foreground">
                          <Store className="w-3 h-3 mr-1" />
                          {getShopName(product.shop_id)}
                        </Badge>
                      </div>
                      {/* Edit & Delete buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {editingProduct !== product.id && (
                          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => startEditing(product)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" className="h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProductMutation.mutate(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      {editingProduct === product.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editFields.name}
                            onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                            placeholder="Product name"
                            className="h-8 text-sm font-semibold"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Type</Label>
                              <Input
                                value={editFields.category}
                                onChange={(e) => setEditFields({ ...editFields, category: e.target.value })}
                                placeholder="e.g., sofa"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Style</Label>
                              <Input
                                value={editFields.style}
                                onChange={(e) => setEditFields({ ...editFields, style: e.target.value })}
                                placeholder="e.g., modern"
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Price (€)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editFields.price}
                                onChange={(e) => setEditFields({ ...editFields, price: e.target.value })}
                                placeholder="0.00"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">URL</Label>
                              <Input
                                value={editFields.source_url}
                                onChange={(e) => setEditFields({ ...editFields, source_url: e.target.value })}
                                placeholder="https://..."
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              onClick={() => saveEditing(product.id)}
                              disabled={updateProductMutation.isPending}
                            >
                              {updateProductMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingProduct(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold line-clamp-1 mb-2">{product.name}</h3>
                          
                          {product.source_url ? (
                            <a
                              href={product.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View product
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-3">No link</p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <Badge variant="secondary">{product.category}</Badge>
                            {product.style && (
                              <Badge variant="outline">{product.style}</Badge>
                            )}
                            {product.price && (
                              <Badge variant="outline">€{product.price}</Badge>
                            )}
                          </div>
                        </>
                      )}

                      {/* Editable AI Style Tags */}
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center gap-1 mb-2">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-xs text-muted-foreground font-medium">AI Style Tags</span>
                        </div>
                        <EditableTagList
                          tags={product.ai_style_tags || []}
                          onUpdate={(tags) => updateTagsMutation.mutate({ productId: product.id, tags })}
                          isPending={updateTagsMutation.isPending}
                        />
                      </div>

                      {/* AI Image Description */}
                      {product.ai_image_description && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-1 mb-2">
                            <Sparkles className="w-3 h-3 text-accent-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">AI Description</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {product.ai_image_description}
                          </p>
                        </div>
                      )}

                      {/* Extracted Colors */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <Palette className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">Furniture Colors</span>
                          </div>
                          {product.image_urls && product.image_urls.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px]"
                              disabled={extractingColorFor === product.id}
                              onClick={() => extractColorsMutation.mutate({
                                productId: product.id,
                                imageUrl: product.image_urls![0],
                              })}
                            >
                              {extractingColorFor === product.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {(product.metadata as any)?.extracted_colors ? "Re-extract" : "Extract"}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        {(product.metadata as any)?.extracted_colors ? (
                          <div className="flex flex-wrap gap-1.5">
                            {((product.metadata as any).extracted_colors as Array<{name: string; hex: string; percentage: number}>).map((color, idx) => (
                              <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-border text-[10px]">
                                <span
                                  className="w-3 h-3 rounded-full border border-border/50 shrink-0"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="font-medium">{color.name}</span>
                                <span className="text-muted-foreground">{color.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">No colors extracted yet</p>
                        )}
                      </div>
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
    </div>
  );
};

export default AdminProductManagement;
