import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CMSEditor from "@/components/admin/CMSEditor";
import AddUserDialog from "@/components/admin/AddUserDialog";
import ProductPagination from "@/components/ProductPagination";
import { usePagination } from "@/hooks/usePagination";
import { 
  Shield, 
  Users, 
  Copy, 
  Plus, 
  LogOut,
  Store,
  Palette,
  FileText,
  CreditCard,
  Package,
  Loader2,
  Sparkles,
  Link,
  ExternalLink
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type InviteRole = "designer" | "furniture_shop" | "admin";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newInviteRole, setNewInviteRole] = useState<InviteRole>("designer");
  const [inviteEmail, setInviteEmail] = useState("");

  // Fetch invites
  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_invites")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch users with roles
  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch ALL products from all shops (super admin view)
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
  const createInviteMutation = useMutation({
    mutationFn: async ({ role, email }: { role: InviteRole; email?: string }) => {
      const { data, error } = await supabase
        .from("role_invites")
        .insert({
          role,
          email: email || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
      const inviteUrl = `${window.location.origin}/auth?invite=${data.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Invite created!",
        description: "Invite link copied to clipboard.",
      });
      setInviteEmail("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create invite",
        variant: "destructive",
      });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard.",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "designer": return <Palette className="w-4 h-4" />;
      case "furniture_shop": return <Store className="w-4 h-4" />;
      case "admin": return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-destructive/10 text-destructive border-destructive/20";
      case "designer": return "bg-primary/10 text-primary border-primary/20";
      case "furniture_shop": return "bg-accent/10 text-accent-foreground border-accent/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Admin Products Tab Component
  const AdminProductsTab = ({ 
    products, 
    productsLoading,
    businessProfiles 
  }: { 
    products: any[] | undefined; 
    productsLoading: boolean;
    businessProfiles: any[] | undefined;
  }) => {
    const pagination = usePagination({
      totalItems: products?.length || 0,
      itemsPerPage: 12,
    });

    const paginatedProducts = products?.slice(pagination.startIndex, pagination.endIndex);
    
    const getShopName = (shopId: string) => {
      const profile = businessProfiles?.find(p => p.user_id === shopId);
      return profile?.business_name || "Unknown Shop";
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            All Products (Super Admin View)
          </CardTitle>
          <CardDescription>
            View all products from all shops ({products?.length || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products?.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products in the system</p>
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
                      {/* Shop badge overlay */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-background/90 text-foreground">
                          <Store className="w-3 h-3 mr-1" />
                          {getShopName(product.shop_id)}
                        </Badge>
                      </div>
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
                          <Badge variant="outline">
                            €{product.price}
                          </Badge>
                        )}
                      </div>

                      {/* AI Generated Tags */}
                      {product.ai_style_tags?.length > 0 && (
                        <div className="pt-3 border-t border-border">
                          <div className="flex items-center gap-1 mb-2">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">AI Style Tags</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.ai_style_tags.map((tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage platform & users</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-5">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="invites" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Invites</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="cms" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">CMS</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          {/* Products Tab - Super Admin View */}
          <TabsContent value="products">
            <AdminProductsTab 
              products={allProducts} 
              productsLoading={productsLoading}
              businessProfiles={businessProfiles}
            />
          </TabsContent>

          {/* Invites Tab */}
          <TabsContent value="invites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Invite</CardTitle>
                <CardDescription>
                  Generate invite links for designers and furniture shops
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newInviteRole} onValueChange={(v) => setNewInviteRole(v as InviteRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="furniture_shop">Furniture Shop</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="partner@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => createInviteMutation.mutate({ role: newInviteRole, email: inviteEmail })}
                      disabled={createInviteMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Invite
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Invites</CardTitle>
                <CardDescription>
                  Manage pending and accepted invite tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitesLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : invites?.length === 0 ? (
                  <p className="text-muted-foreground">No invites yet</p>
                ) : (
                  <div className="space-y-3">
                    {invites?.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          {getRoleIcon(invite.role)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {invite.role.replace("_", " ")}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  invite.status === "pending"
                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    : invite.status === "accepted"
                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                    : "bg-muted text-muted-foreground"
                                }
                              >
                                {invite.status}
                              </Badge>
                            </div>
                            {invite.email && (
                              <p className="text-sm text-muted-foreground">{invite.email}</p>
                            )}
                          </div>
                        </div>
                        {invite.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyInviteLink(invite.token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-end">
              <AddUserDialog />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>
                  View all users with assigned roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userRoles?.length === 0 ? (
                  <p className="text-muted-foreground">No users with roles yet</p>
                ) : (
                  <div className="space-y-3">
                    {userRoles?.map((ur) => (
                      <div
                        key={ur.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          {getRoleIcon(ur.role)}
                          <div>
                            <p className="font-mono text-sm">{ur.user_id}</p>
                            <Badge variant="outline" className={getRoleBadgeColor(ur.role)}>
                              {ur.role.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CMS Tab */}
          <TabsContent value="cms">
            <CMSEditor />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing & Credits
                </CardTitle>
                <CardDescription>
                  Manage credit packages and payment settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 rounded-lg bg-muted/50 border border-dashed border-border text-center">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Payment Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your payment provider to enable credit purchases
                  </p>
                  <Button disabled variant="outline">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
