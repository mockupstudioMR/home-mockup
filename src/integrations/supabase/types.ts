export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      business_profiles: {
        Row: {
          business_name: string
          city: string | null
          country: string | null
          created_at: string
          credits_balance: number
          description: string | null
          id: string
          logo_url: string | null
          phone: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          business_name: string
          city?: string | null
          country?: string | null
          created_at?: string
          credits_balance?: number
          description?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          business_name?: string
          city?: string | null
          country?: string | null
          created_at?: string
          credits_balance?: number
          description?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cms_content: {
        Row: {
          content_type: string
          created_at: string
          id: string
          key: string
          metadata: Json | null
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          key: string
          metadata?: Json | null
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          key?: string
          metadata?: Json | null
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          stripe_payment_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      design_items: {
        Row: {
          bounding_box: Json | null
          color: string | null
          created_at: string
          design_id: string
          google_images_url: string | null
          google_shopping_url: string | null
          hex_code: string | null
          id: string
          item_description: string | null
          item_name: string
          item_type: string
          matched_product_id: string | null
          material: string | null
          priority: string | null
          style: string | null
        }
        Insert: {
          bounding_box?: Json | null
          color?: string | null
          created_at?: string
          design_id: string
          google_images_url?: string | null
          google_shopping_url?: string | null
          hex_code?: string | null
          id?: string
          item_description?: string | null
          item_name: string
          item_type: string
          matched_product_id?: string | null
          material?: string | null
          priority?: string | null
          style?: string | null
        }
        Update: {
          bounding_box?: Json | null
          color?: string | null
          created_at?: string
          design_id?: string
          google_images_url?: string | null
          google_shopping_url?: string | null
          hex_code?: string | null
          id?: string
          item_description?: string | null
          item_name?: string
          item_type?: string
          matched_product_id?: string | null
          material?: string | null
          priority?: string | null
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_items_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_items_matched_product_id_fkey"
            columns: ["matched_product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_designs: {
        Row: {
          created_at: string
          extracted_items: Json | null
          full_description: string | null
          id: string
          image_url: string
          is_favorite: boolean | null
          is_locked: boolean | null
          locked_at: string | null
          modification_history: Json | null
          parent_design_id: string | null
          prompt: string
          quiz_response_id: string | null
          source_image_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_items?: Json | null
          full_description?: string | null
          id?: string
          image_url: string
          is_favorite?: boolean | null
          is_locked?: boolean | null
          locked_at?: string | null
          modification_history?: Json | null
          parent_design_id?: string | null
          prompt: string
          quiz_response_id?: string | null
          source_image_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_items?: Json | null
          full_description?: string | null
          id?: string
          image_url?: string
          is_favorite?: boolean | null
          is_locked?: boolean | null
          locked_at?: string | null
          modification_history?: Json | null
          parent_design_id?: string | null
          prompt?: string
          quiz_response_id?: string | null
          source_image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_designs_parent_design_id_fkey"
            columns: ["parent_design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_designs_quiz_response_id_fkey"
            columns: ["quiz_response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email: string | null
          email_verified: boolean | null
          id: string
          phone: string | null
          preference: Database["public"]["Enums"]["notification_preference"]
          updated_at: string
          user_id: string
          whatsapp_verified: boolean | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id?: string
          phone?: string | null
          preference?: Database["public"]["Enums"]["notification_preference"]
          updated_at?: string
          user_id: string
          whatsapp_verified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id?: string
          phone?: string | null
          preference?: Database["public"]["Enums"]["notification_preference"]
          updated_at?: string
          user_id?: string
          whatsapp_verified?: boolean | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          credits_used: number
          currency: string | null
          description: string | null
          from_user_id: string
          id: string
          offer_type: string
          price: number | null
          product_ids: string[] | null
          responded_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["offer_status"]
          title: string
          to_user_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          credits_used?: number
          currency?: string | null
          description?: string | null
          from_user_id: string
          id?: string
          offer_type: string
          price?: number | null
          product_ids?: string[] | null
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title: string
          to_user_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          credits_used?: number
          currency?: string | null
          description?: string | null
          from_user_id?: string
          id?: string
          offer_type?: string
          price?: number | null
          product_ids?: string[] | null
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          to_user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      product_matches: {
        Row: {
          created_at: string
          id: string
          match_reasons: string[] | null
          match_score: number
          product_id: string
          quiz_response_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          match_score: number
          product_id: string
          quiz_response_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_reasons?: string[] | null
          match_score?: number
          product_id?: string
          quiz_response_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_matches_quiz_response_id_fkey"
            columns: ["quiz_response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          budget_feel: string
          color_palette: string
          created_at: string
          furniture_source: string | null
          id: string
          must_have_elements: string[] | null
          room_type: string
          style_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_feel: string
          color_palette: string
          created_at?: string
          furniture_source?: string | null
          id?: string
          must_have_elements?: string[] | null
          room_type: string
          style_preference: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_feel?: string
          color_palette?: string
          created_at?: string
          furniture_source?: string | null
          id?: string
          must_have_elements?: string[] | null
          room_type?: string
          style_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          used_by?: string | null
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          ai_image_description: string | null
          ai_style_tags: string[] | null
          category: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number | null
          shop_id: string
          source_url: string | null
          style: string | null
          updated_at: string
        }
        Insert: {
          ai_image_description?: string | null
          ai_style_tags?: string[] | null
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price?: number | null
          shop_id: string
          source_url?: string | null
          style?: string | null
          updated_at?: string
        }
        Update: {
          ai_image_description?: string | null
          ai_style_tags?: string[] | null
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number | null
          shop_id?: string
          source_url?: string | null
          style?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { invite_token: string }; Returns: boolean }
      deduct_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "designer" | "furniture_shop" | "user"
      invite_status: "pending" | "accepted" | "expired"
      notification_preference: "email" | "whatsapp" | "both"
      offer_status: "pending" | "sent" | "viewed" | "accepted" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "designer", "furniture_shop", "user"],
      invite_status: ["pending", "accepted", "expired"],
      notification_preference: ["email", "whatsapp", "both"],
      offer_status: ["pending", "sent", "viewed", "accepted", "rejected"],
    },
  },
} as const
