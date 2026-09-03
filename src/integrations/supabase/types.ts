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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          screen: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          screen: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          screen?: string
          user_id?: string
        }
        Relationships: []
      }
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
          product_photo_url: string | null
          style: string | null
          wall_type: string | null
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
          product_photo_url?: string | null
          style?: string | null
          wall_type?: string | null
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
          product_photo_url?: string | null
          style?: string | null
          wall_type?: string | null
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
      design_journey_metadata: {
        Row: {
          budget: Json
          created_at: string
          design_id: string
          health_score: number | null
          id: string
          metadata: Json
          roadmap: Json
          shopping: Json
          style_dna: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: Json
          created_at?: string
          design_id: string
          health_score?: number | null
          id?: string
          metadata?: Json
          roadmap?: Json
          shopping?: Json
          style_dna?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: Json
          created_at?: string
          design_id?: string
          health_score?: number | null
          id?: string
          metadata?: Json
          roadmap?: Json
          shopping?: Json
          style_dna?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_journey_metadata_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: true
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_plan_analyses: {
        Row: {
          created_at: string
          id: string
          image_hash: string
          image_url: string
          metadata: Json
          plan: Json
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_hash: string
          image_url: string
          metadata?: Json
          plan?: Json
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_hash?: string
          image_url?: string
          metadata?: Json
          plan?: Json
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      furniture_specs: {
        Row: {
          companion_of: string | null
          created_at: string
          default_orientation: string
          depth_cm: number
          grouping_key: string | null
          id: string
          min_clearance_cm: number
          must_against_wall: boolean
          name: string
          updated_at: string
          width_cm: number
        }
        Insert: {
          companion_of?: string | null
          created_at?: string
          default_orientation?: string
          depth_cm?: number
          grouping_key?: string | null
          id?: string
          min_clearance_cm?: number
          must_against_wall?: boolean
          name: string
          updated_at?: string
          width_cm?: number
        }
        Update: {
          companion_of?: string | null
          created_at?: string
          default_orientation?: string
          depth_cm?: number
          grouping_key?: string | null
          id?: string
          min_clearance_cm?: number
          must_against_wall?: boolean
          name?: string
          updated_at?: string
          width_cm?: number
        }
        Relationships: []
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
          moodboard: Json | null
          parent_design_id: string | null
          prompt: string
          quiz_response_id: string | null
          room_id: string | null
          source_image_url: string | null
          title: string | null
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
          moodboard?: Json | null
          parent_design_id?: string | null
          prompt: string
          quiz_response_id?: string | null
          room_id?: string | null
          source_image_url?: string | null
          title?: string | null
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
          moodboard?: Json | null
          parent_design_id?: string | null
          prompt?: string
          quiz_response_id?: string | null
          room_id?: string | null
          source_image_url?: string | null
          title?: string | null
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
          {
            foreignKeyName: "generated_designs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_products: {
        Row: {
          created_at: string
          currency: string | null
          design_id: string | null
          id: string
          image_url: string | null
          is_pinned: boolean
          metadata: Json
          name: string | null
          price: number | null
          section: string | null
          session_id: string | null
          source_url: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          design_id?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          metadata?: Json
          name?: string | null
          price?: number | null
          section?: string | null
          session_id?: string | null
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          design_id?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          metadata?: Json
          name?: string | null
          price?: number | null
          section?: string | null
          session_id?: string | null
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_products_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_products_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "journey_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_sessions: {
        Row: {
          created_at: string
          history: Json
          id: string
          payload: Json
          stage: string
          sub_step: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          history?: Json
          id?: string
          payload?: Json
          stage?: string
          sub_step?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          history?: Json
          id?: string
          payload?: Json
          stage?: string
          sub_step?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      layout_feedback: {
        Row: {
          agreed: boolean
          ai_reason: string | null
          created_at: string
          furniture_item: string
          height_pct: number | null
          id: string
          layout_name: string | null
          openings: Json | null
          position_x: number | null
          position_y: number | null
          room_dimensions: Json | null
          room_shape: string | null
          room_type: string | null
          user_id: string
          user_note: string | null
          width_pct: number | null
        }
        Insert: {
          agreed: boolean
          ai_reason?: string | null
          created_at?: string
          furniture_item: string
          height_pct?: number | null
          id?: string
          layout_name?: string | null
          openings?: Json | null
          position_x?: number | null
          position_y?: number | null
          room_dimensions?: Json | null
          room_shape?: string | null
          room_type?: string | null
          user_id: string
          user_note?: string | null
          width_pct?: number | null
        }
        Update: {
          agreed?: boolean
          ai_reason?: string | null
          created_at?: string
          furniture_item?: string
          height_pct?: number | null
          id?: string
          layout_name?: string | null
          openings?: Json | null
          position_x?: number | null
          position_y?: number | null
          room_dimensions?: Json | null
          room_shape?: string | null
          room_type?: string | null
          user_id?: string
          user_note?: string | null
          width_pct?: number | null
        }
        Relationships: []
      }
      material_visuals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          kind: string
          label: string
          label_key: string | null
          style_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          kind: string
          label: string
          label_key?: string | null
          style_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          kind?: string
          label?: string
          label_key?: string | null
          style_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      moodboard_assets: {
        Row: {
          created_at: string
          design_id: string | null
          id: string
          image_url: string
          is_pinned: boolean
          kind: string
          label: string | null
          metadata: Json
          position: number
          prompt: string | null
          section: string
          session_id: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          design_id?: string | null
          id?: string
          image_url: string
          is_pinned?: boolean
          kind?: string
          label?: string | null
          metadata?: Json
          position?: number
          prompt?: string | null
          section: string
          session_id?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          design_id?: string | null
          id?: string
          image_url?: string
          is_pinned?: boolean
          kind?: string
          label?: string | null
          metadata?: Json
          position?: number
          prompt?: string | null
          section?: string
          session_id?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_assets_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moodboard_assets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "journey_sessions"
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
      opening_rules: {
        Row: {
          attracts_furniture: string[] | null
          clearance_cm: number
          created_at: string
          id: string
          opening_type: string
          repels_furniture: string[] | null
          requires_path_to: string[] | null
          updated_at: string
        }
        Insert: {
          attracts_furniture?: string[] | null
          clearance_cm?: number
          created_at?: string
          id?: string
          opening_type: string
          repels_furniture?: string[] | null
          requires_path_to?: string[] | null
          updated_at?: string
        }
        Update: {
          attracts_furniture?: string[] | null
          clearance_cm?: number
          created_at?: string
          id?: string
          opening_type?: string
          repels_furniture?: string[] | null
          requires_path_to?: string[] | null
          updated_at?: string
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
      products: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          design_id: string | null
          design_item_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          material: string | null
          metadata: Json
          name: string
          price: number | null
          shop_id: string | null
          shop_name: string
          source_url: string | null
          style: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          design_id?: string | null
          design_item_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          material?: string | null
          metadata?: Json
          name: string
          price?: number | null
          shop_id?: string | null
          shop_name?: string
          source_url?: string | null
          style?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          design_id?: string | null
          design_item_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          material?: string | null
          metadata?: Json
          name?: string
          price?: number | null
          shop_id?: string | null
          shop_name?: string
          source_url?: string | null
          style?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_design_item_id_fkey"
            columns: ["design_item_id"]
            isOneToOne: false
            referencedRelation: "design_items"
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
      prompt_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          template: string
          template_key: string
          template_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          template: string
          template_key: string
          template_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          template?: string
          template_key?: string
          template_label?: string
          updated_at?: string
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
      room_activities: {
        Row: {
          activity_name: string
          advisory_text: string | null
          created_at: string
          furniture_items: string[]
          id: string
          is_predefined: boolean
          opening_affinity: Json | null
          preferred_orientation: string
          preferred_zone: string
          priority: number
          room_type: string
          space_weight: number
          updated_at: string
        }
        Insert: {
          activity_name: string
          advisory_text?: string | null
          created_at?: string
          furniture_items?: string[]
          id?: string
          is_predefined?: boolean
          opening_affinity?: Json | null
          preferred_orientation?: string
          preferred_zone?: string
          priority?: number
          room_type: string
          space_weight?: number
          updated_at?: string
        }
        Update: {
          activity_name?: string
          advisory_text?: string | null
          created_at?: string
          furniture_items?: string[]
          id?: string
          is_predefined?: boolean
          opening_affinity?: Json | null
          preferred_orientation?: string
          preferred_zone?: string
          priority?: number
          room_type?: string
          space_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      room_furniture_config: {
        Row: {
          created_at: string
          description: string | null
          furniture_items: string[]
          id: string
          room_label: string
          room_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          furniture_items?: string[]
          id?: string
          room_label: string
          room_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          furniture_items?: string[]
          id?: string
          room_label?: string
          room_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          custom_walls: Json | null
          dimensions: Json
          furniture: Json
          id: string
          layout: Json | null
          name: string
          room_type: string
          schema_version: number
          shape: string
          style: Json
          updated_at: string
          user_id: string
          walls: Json
        }
        Insert: {
          created_at?: string
          custom_walls?: Json | null
          dimensions?: Json
          furniture?: Json
          id?: string
          layout?: Json | null
          name?: string
          room_type?: string
          schema_version?: number
          shape?: string
          style?: Json
          updated_at?: string
          user_id: string
          walls?: Json
        }
        Update: {
          created_at?: string
          custom_walls?: Json | null
          dimensions?: Json
          furniture?: Json
          id?: string
          layout?: Json | null
          name?: string
          room_type?: string
          schema_version?: number
          shape?: string
          style?: Json
          updated_at?: string
          user_id?: string
          walls?: Json
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          ai_image_description: string | null
          ai_style_tags: string[] | null
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
          type: string
          updated_at: string
        }
        Insert: {
          ai_image_description?: string | null
          ai_style_tags?: string[] | null
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
          type: string
          updated_at?: string
        }
        Update: {
          ai_image_description?: string | null
          ai_style_tags?: string[] | null
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
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          created_at: string
          design_id: string | null
          id: string
          list: Json
          measurements: Json
          metadata: Json
          room_id: string | null
          room_label: string | null
          scope_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          design_id?: string | null
          id?: string
          list?: Json
          measurements?: Json
          metadata?: Json
          room_id?: string | null
          room_label?: string | null
          scope_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          design_id?: string | null
          id?: string
          list?: Json
          measurements?: Json
          metadata?: Json
          room_id?: string | null
          room_label?: string | null
          scope_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      style_prompts: {
        Row: {
          created_at: string
          generated_image_url: string | null
          id: string
          input_kind: string
          metadata: Json
          prompt: string
          session_id: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_image_url?: string | null
          id?: string
          input_kind?: string
          metadata?: Json
          prompt: string
          session_id?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_image_url?: string | null
          id?: string
          input_kind?: string
          metadata?: Json
          prompt?: string
          session_id?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_prompts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "journey_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_quiz_sessions: {
        Row: {
          answers: Json
          created_at: string
          current_step: number
          id: string
          last_message_sid: string | null
          phone_e164: string
          status: string
          step_token: string | null
          step_token_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          current_step?: number
          id?: string
          last_message_sid?: string | null
          phone_e164: string
          status?: string
          step_token?: string | null
          step_token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          current_step?: number
          id?: string
          last_message_sid?: string | null
          phone_e164?: string
          status?: string
          step_token?: string | null
          step_token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
