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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          row_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: number
          row_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: number
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
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
      combination_signals: {
        Row: {
          combination_id: string
          created_at: string
          design_id: string | null
          id: string
          note: string | null
          room_id: string | null
          signal: Database["public"]["Enums"]["combination_signal"]
          user_id: string | null
        }
        Insert: {
          combination_id: string
          created_at?: string
          design_id?: string | null
          id?: string
          note?: string | null
          room_id?: string | null
          signal: Database["public"]["Enums"]["combination_signal"]
          user_id?: string | null
        }
        Update: {
          combination_id?: string
          created_at?: string
          design_id?: string | null
          id?: string
          note?: string | null
          room_id?: string | null
          signal?: Database["public"]["Enums"]["combination_signal"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "combination_signals_combination_id_fkey"
            columns: ["combination_id"]
            isOneToOne: false
            referencedRelation: "scheme_combinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combination_signals_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combination_signals_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_rules: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          source: string
          strength: number
          term_a_id: string
          term_b_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          source?: string
          strength?: number
          term_a_id: string
          term_b_id: string
          verdict: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          source?: string
          strength?: number
          term_a_id?: string
          term_b_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_rules_term_a_id_fkey"
            columns: ["term_a_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibility_rules_term_b_id_fkey"
            columns: ["term_b_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
        ]
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
      custom_made_requests: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          drawing_path: string | null
          id: string
          maker_contact: string | null
          maker_name: string | null
          quote_amount: number | null
          room_item_id: string
          spec: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          drawing_path?: string | null
          id?: string
          maker_contact?: string | null
          maker_name?: string | null
          quote_amount?: number | null
          room_item_id: string
          spec?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          drawing_path?: string | null
          id?: string
          maker_contact?: string | null
          maker_name?: string | null
          quote_amount?: number | null
          room_item_id?: string
          spec?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_made_requests_room_item_id_fkey"
            columns: ["room_item_id"]
            isOneToOne: false
            referencedRelation: "room_items"
            referencedColumns: ["id"]
          },
        ]
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
          scheme_id: string | null
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
          scheme_id?: string | null
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
          scheme_id?: string | null
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
          {
            foreignKeyName: "design_items_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
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
      design_remarks: {
        Row: {
          category: Database["public"]["Enums"]["remark_category"]
          change_note: string | null
          created_at: string
          decision: Database["public"]["Enums"]["keep_change"]
          design_id: string
          id: string
          keywords: string[]
          model: string | null
          pin_x_pct: number | null
          pin_y_pct: number | null
          remark: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["remark_category"]
          change_note?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["keep_change"]
          design_id: string
          id?: string
          keywords?: string[]
          model?: string | null
          pin_x_pct?: number | null
          pin_y_pct?: number | null
          remark: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["remark_category"]
          change_note?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["keep_change"]
          design_id?: string
          id?: string
          keywords?: string[]
          model?: string | null
          pin_x_pct?: number | null
          pin_y_pct?: number | null
          remark?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_remarks_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      design_scheme_links: {
        Row: {
          combination_id: string | null
          confidence: number | null
          created_at: string
          design_id: string
          design_item_id: string | null
          direction: string
          id: string
          scheme_id: string | null
        }
        Insert: {
          combination_id?: string | null
          confidence?: number | null
          created_at?: string
          design_id: string
          design_item_id?: string | null
          direction: string
          id?: string
          scheme_id?: string | null
        }
        Update: {
          combination_id?: string | null
          confidence?: number | null
          created_at?: string
          design_id?: string
          design_item_id?: string | null
          direction?: string
          id?: string
          scheme_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_scheme_links_combination_id_fkey"
            columns: ["combination_id"]
            isOneToOne: false
            referencedRelation: "scheme_combinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_scheme_links_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_scheme_links_design_item_id_fkey"
            columns: ["design_item_id"]
            isOneToOne: false
            referencedRelation: "design_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_scheme_links_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_pieces: {
        Row: {
          box: Json | null
          category_id: string | null
          color_id: string | null
          confidence: number | null
          created_at: string
          crop_path: string | null
          id: string
          item_id: string
          material_id: string | null
          raw: Json
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheme_id: string | null
          status: string
          style_id: string | null
          tag_ids: string[]
        }
        Insert: {
          box?: Json | null
          category_id?: string | null
          color_id?: string | null
          confidence?: number | null
          created_at?: string
          crop_path?: string | null
          id?: string
          item_id: string
          material_id?: string | null
          raw?: Json
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheme_id?: string | null
          status?: string
          style_id?: string | null
          tag_ids?: string[]
        }
        Update: {
          box?: Json | null
          category_id?: string | null
          color_id?: string | null
          confidence?: number | null
          created_at?: string
          crop_path?: string | null
          id?: string
          item_id?: string
          material_id?: string | null
          raw?: Json
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheme_id?: string | null
          status?: string
          style_id?: string | null
          tag_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "detected_pieces_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_pieces_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_pieces_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ingest_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_pieces_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_pieces_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_pieces_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      detection_corrections: {
        Row: {
          ai_value: string | null
          created_at: string
          facet: string
          fixed_by: string | null
          fixed_value: string | null
          id: string
          piece_id: string
        }
        Insert: {
          ai_value?: string | null
          created_at?: string
          facet: string
          fixed_by?: string | null
          fixed_value?: string | null
          id?: string
          piece_id: string
        }
        Update: {
          ai_value?: string | null
          created_at?: string
          facet?: string
          fixed_by?: string | null
          fixed_value?: string | null
          id?: string
          piece_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detection_corrections_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "detected_pieces"
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
      furniture_scheme_tags: {
        Row: {
          scheme_id: string
          term_id: string
        }
        Insert: {
          scheme_id: string
          term_id: string
        }
        Update: {
          scheme_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "furniture_scheme_tags_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "furniture_scheme_tags_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      furniture_schemes: {
        Row: {
          category_facet: Database["public"]["Enums"]["term_facet"]
          category_id: string
          color_facet: Database["public"]["Enums"]["term_facet"]
          color_id: string | null
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          material_facet: Database["public"]["Enums"]["term_facet"]
          material_id: string | null
          source: string
          status: string
          style_facet: Database["public"]["Enums"]["term_facet"]
          style_id: string | null
          tag_signature: string
        }
        Insert: {
          category_facet?: Database["public"]["Enums"]["term_facet"]
          category_id: string
          color_facet?: Database["public"]["Enums"]["term_facet"]
          color_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          material_facet?: Database["public"]["Enums"]["term_facet"]
          material_id?: string | null
          source?: string
          status?: string
          style_facet?: Database["public"]["Enums"]["term_facet"]
          style_id?: string | null
          tag_signature?: string
        }
        Update: {
          category_facet?: Database["public"]["Enums"]["term_facet"]
          category_id?: string
          color_facet?: Database["public"]["Enums"]["term_facet"]
          color_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          material_facet?: Database["public"]["Enums"]["term_facet"]
          material_id?: string | null
          source?: string
          status?: string
          style_facet?: Database["public"]["Enums"]["term_facet"]
          style_id?: string | null
          tag_signature?: string
        }
        Relationships: [
          {
            foreignKeyName: "furniture_schemes_category_id_category_facet_fkey"
            columns: ["category_id", "category_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
          {
            foreignKeyName: "furniture_schemes_color_id_color_facet_fkey"
            columns: ["color_id", "color_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
          {
            foreignKeyName: "furniture_schemes_material_id_material_facet_fkey"
            columns: ["material_id", "material_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
          {
            foreignKeyName: "furniture_schemes_style_id_style_facet_fkey"
            columns: ["style_id", "style_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
        ]
      }
      furniture_specs: {
        Row: {
          category: string | null
          category_term_id: string | null
          companion_of: string | null
          created_at: string
          default_orientation: string
          depth_cm: number
          extra_dims: Json
          grouping_key: string | null
          height_cm: number | null
          id: string
          is_default: boolean
          min_clearance_cm: number
          must_against_wall: boolean
          name: string
          source: string | null
          updated_at: string
          variant: string
          width_cm: number
        }
        Insert: {
          category?: string | null
          category_term_id?: string | null
          companion_of?: string | null
          created_at?: string
          default_orientation?: string
          depth_cm?: number
          extra_dims?: Json
          grouping_key?: string | null
          height_cm?: number | null
          id?: string
          is_default?: boolean
          min_clearance_cm?: number
          must_against_wall?: boolean
          name: string
          source?: string | null
          updated_at?: string
          variant?: string
          width_cm?: number
        }
        Update: {
          category?: string | null
          category_term_id?: string | null
          companion_of?: string | null
          created_at?: string
          default_orientation?: string
          depth_cm?: number
          extra_dims?: Json
          grouping_key?: string | null
          height_cm?: number | null
          id?: string
          is_default?: boolean
          min_clearance_cm?: number
          must_against_wall?: boolean
          name?: string
          source?: string | null
          updated_at?: string
          variant?: string
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "furniture_specs_category_term_id_fkey"
            columns: ["category_term_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_designs: {
        Row: {
          change_request: string | null
          created_at: string
          extracted_items: Json | null
          full_description: string | null
          id: string
          image_url: string
          is_favorite: boolean | null
          is_kept: boolean
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
          version_no: number | null
        }
        Insert: {
          change_request?: string | null
          created_at?: string
          extracted_items?: Json | null
          full_description?: string | null
          id?: string
          image_url: string
          is_favorite?: boolean | null
          is_kept?: boolean
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
          version_no?: number | null
        }
        Update: {
          change_request?: string | null
          created_at?: string
          extracted_items?: Json | null
          full_description?: string | null
          id?: string
          image_url?: string
          is_favorite?: boolean | null
          is_kept?: boolean
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
          version_no?: number | null
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
      ingest_batches: {
        Row: {
          created_at: string
          created_by: string | null
          failed_count: number
          finished_at: string | null
          found_count: number
          id: string
          name: string
          review_all: boolean
          room_type_id: string | null
          saved_count: number
          source_credit: string | null
          source_type: string
          source_url: string | null
          status: string
          style_hint_id: string | null
          threshold: number
          waiting_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failed_count?: number
          finished_at?: string | null
          found_count?: number
          id?: string
          name: string
          review_all?: boolean
          room_type_id?: string | null
          saved_count?: number
          source_credit?: string | null
          source_type: string
          source_url?: string | null
          status?: string
          style_hint_id?: string | null
          threshold?: number
          waiting_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failed_count?: number
          finished_at?: string | null
          found_count?: number
          id?: string
          name?: string
          review_all?: boolean
          room_type_id?: string | null
          saved_count?: number
          source_credit?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          style_hint_id?: string | null
          threshold?: number
          waiting_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingest_batches_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingest_batches_style_hint_id_fkey"
            columns: ["style_hint_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      ingest_items: {
        Row: {
          batch_id: string
          created_at: string
          detected_style_id: string | null
          error: string | null
          file_hash: string | null
          id: string
          page_no: number | null
          source_url: string | null
          status: string
          storage_path: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          detected_style_id?: string | null
          error?: string | null
          file_hash?: string | null
          id?: string
          page_no?: number | null
          source_url?: string | null
          status?: string
          storage_path?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          detected_style_id?: string | null
          error?: string | null
          file_hash?: string | null
          id?: string
          page_no?: number | null
          source_url?: string | null
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingest_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ingest_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingest_items_detected_style_id_fkey"
            columns: ["detected_style_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
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
          room_id: string | null
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
          room_id?: string | null
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
          room_id?: string | null
          room_shape?: string | null
          room_type?: string | null
          user_id?: string
          user_note?: string | null
          width_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "layout_feedback_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
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
          term_id: string | null
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
          term_id?: string | null
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
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_visuals_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_checks: {
        Row: {
          check_group: string
          check_key: string
          done_at: string | null
          id: string
          is_done: boolean
          item_id: string | null
          label: string
          room_id: string
          unit: string | null
          value_numeric: number | null
        }
        Insert: {
          check_group: string
          check_key: string
          done_at?: string | null
          id?: string
          is_done?: boolean
          item_id?: string | null
          label: string
          room_id: string
          unit?: string | null
          value_numeric?: number | null
        }
        Update: {
          check_group?: string
          check_key?: string
          done_at?: string | null
          id?: string
          is_done?: boolean
          item_id?: string | null
          label?: string
          room_id?: string
          unit?: string | null
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurement_checks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "room_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_checks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          ai_analysis: Json | null
          capture: string
          created_at: string
          id: string
          owner_id: string
          project_id: string
          room_id: string | null
          sort_order: number
          storage_bucket: string
          storage_path: string
          subject: Database["public"]["Enums"]["media_subject"]
          subject_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          capture?: string
          created_at?: string
          id?: string
          owner_id: string
          project_id: string
          room_id?: string | null
          sort_order?: number
          storage_bucket?: string
          storage_path: string
          subject: Database["public"]["Enums"]["media_subject"]
          subject_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          capture?: string
          created_at?: string
          id?: string
          owner_id?: string
          project_id?: string
          room_id?: string | null
          sort_order?: number
          storage_bucket?: string
          storage_path?: string
          subject?: Database["public"]["Enums"]["media_subject"]
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
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
      palette_colors: {
        Row: {
          color_facet: Database["public"]["Enums"]["term_facet"]
          color_id: string
          palette_id: string
          position: number
          role: string | null
        }
        Insert: {
          color_facet?: Database["public"]["Enums"]["term_facet"]
          color_id: string
          palette_id: string
          position: number
          role?: string | null
        }
        Update: {
          color_facet?: Database["public"]["Enums"]["term_facet"]
          color_id?: string
          palette_id?: string
          position?: number
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "palette_colors_color_id_color_facet_fkey"
            columns: ["color_id", "color_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
          {
            foreignKeyName: "palette_colors_palette_id_fkey"
            columns: ["palette_id"]
            isOneToOne: false
            referencedRelation: "palettes"
            referencedColumns: ["id"]
          },
        ]
      }
      palettes: {
        Row: {
          created_at: string
          id: string
          name: string
          source: string
          style_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          source?: string
          style_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source?: string
          style_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "palettes_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
        ]
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
      product_scheme_links: {
        Row: {
          confidence: number | null
          confirmed: boolean
          created_at: string
          product_id: string
          scheme_id: string
          source: string
        }
        Insert: {
          confidence?: number | null
          confirmed?: boolean
          created_at?: string
          product_id: string
          scheme_id: string
          source?: string
        }
        Update: {
          confidence?: number | null
          confirmed?: boolean
          created_at?: string
          product_id?: string
          scheme_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_scheme_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_scheme_links_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
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
          scheme_id: string | null
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
          scheme_id?: string | null
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
          scheme_id?: string | null
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
          {
            foreignKeyName: "products_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
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
      project_collaborators: {
        Row: {
          accepted_at: string | null
          email: string | null
          id: string
          invite_status: Database["public"]["Enums"]["invite_status"]
          invite_token: string | null
          invited_at: string
          project_id: string
          role: Database["public"]["Enums"]["collaborator_role"]
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          email?: string | null
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          invite_token?: string | null
          invited_at?: string
          project_id: string
          role: Database["public"]["Enums"]["collaborator_role"]
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string | null
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          invite_token?: string | null
          invited_at?: string
          project_id?: string
          role?: Database["public"]["Enums"]["collaborator_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_deliverables: {
        Row: {
          generated_at: string | null
          id: string
          kind: Database["public"]["Enums"]["deliverable_kind"]
          project_id: string
          room_id: string | null
          status: Database["public"]["Enums"]["deliverable_status"]
          storage_path: string | null
        }
        Insert: {
          generated_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["deliverable_kind"]
          project_id: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          storage_path?: string | null
        }
        Update: {
          generated_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["deliverable_kind"]
          project_id?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deliverables_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shop_choices: {
        Row: {
          own_shops_first: boolean
          project_id: string
          updated_at: string
          use_custom_made: boolean
          use_own_shops: boolean
          use_suggested: boolean
        }
        Insert: {
          own_shops_first?: boolean
          project_id: string
          updated_at?: string
          use_custom_made?: boolean
          use_own_shops?: boolean
          use_suggested?: boolean
        }
        Update: {
          own_shops_first?: boolean
          project_id?: string
          updated_at?: string
          use_custom_made?: boolean
          use_own_shops?: boolean
          use_suggested?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "project_shop_choices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shops: {
        Row: {
          added_at: string
          added_by: string | null
          project_id: string
          shop_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          project_id: string
          shop_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          project_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_shops_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shops_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          collaborator_id: string | null
          created_at: string
          due_date: string | null
          id: string
          owner_role: Database["public"]["Enums"]["collaborator_role"] | null
          project_id: string
          room_id: string | null
          sort_order: number
          stage_no: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          collaborator_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          owner_role?: Database["public"]["Enums"]["collaborator_role"] | null
          project_id: string
          room_id?: string | null
          sort_order?: number
          stage_no: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          collaborator_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          owner_role?: Database["public"]["Enums"]["collaborator_role"] | null
          project_id?: string
          room_id?: string | null
          sort_order?: number
          stage_no?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "project_collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          budget_max: number | null
          budget_min: number | null
          city_or_postcode: string | null
          created_at: string
          currency: string
          id: string
          intent: Database["public"]["Enums"]["project_intent"]
          name: string
          owner_id: string
          property_type: Database["public"]["Enums"]["property_type"] | null
          renovation_restriction: string | null
          step1_completed_at: string | null
          target_timing: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city_or_postcode?: string | null
          created_at?: string
          currency?: string
          id?: string
          intent: Database["public"]["Enums"]["project_intent"]
          name?: string
          owner_id: string
          property_type?: Database["public"]["Enums"]["property_type"] | null
          renovation_restriction?: string | null
          step1_completed_at?: string | null
          target_timing?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city_or_postcode?: string | null
          created_at?: string
          currency?: string
          id?: string
          intent?: Database["public"]["Enums"]["project_intent"]
          name?: string
          owner_id?: string
          property_type?: Database["public"]["Enums"]["property_type"] | null
          renovation_restriction?: string | null
          step1_completed_at?: string | null
          target_timing?: string | null
          updated_at?: string
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
      retailer_posts: {
        Row: {
          body: string | null
          caption: string | null
          channel: string
          created_at: string
          hashtags: string | null
          id: string
          image_prompt: string | null
          image_url: string | null
          is_pinned: boolean
          language: string | null
          metadata: Json
          preview: string | null
          profile_id: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          caption?: string | null
          channel: string
          created_at?: string
          hashtags?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_pinned?: boolean
          language?: string | null
          metadata?: Json
          preview?: string | null
          profile_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          caption?: string | null
          channel?: string
          created_at?: string
          hashtags?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_pinned?: boolean
          language?: string | null
          metadata?: Json
          preview?: string | null
          profile_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "retailer_style_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_style_profiles: {
        Row: {
          analysis: Json | null
          created_at: string
          id: string
          product_images: Json
          product_links: Json
          product_range: string | null
          product_types: string[]
          sales_channel: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          id?: string
          product_images?: Json
          product_links?: Json
          product_range?: string | null
          product_types?: string[]
          sales_channel?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          id?: string
          product_images?: Json
          product_links?: Json
          product_range?: string | null
          product_types?: string[]
          sales_channel?: string | null
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
      room_activity_choices: {
        Row: {
          activity_id: string | null
          created_at: string
          custom_label: string | null
          id: string
          room_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          custom_label?: string | null
          id?: string
          room_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          custom_label?: string | null
          id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_activity_choices_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "room_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_activity_choices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_features: {
        Row: {
          created_at: string
          id: string
          is_movable: boolean
          is_placed: boolean | null
          kind: Database["public"]["Enums"]["feature_kind"]
          label: string
          plan_x_pct: number | null
          plan_y_pct: number | null
          position_pct: number | null
          room_id: string
          source: string
          status: Database["public"]["Enums"]["point_status"]
          updated_at: string
          wall_id: string | null
          width_cm: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_movable?: boolean
          is_placed?: boolean | null
          kind: Database["public"]["Enums"]["feature_kind"]
          label: string
          plan_x_pct?: number | null
          plan_y_pct?: number | null
          position_pct?: number | null
          room_id: string
          source?: string
          status?: Database["public"]["Enums"]["point_status"]
          updated_at?: string
          wall_id?: string | null
          width_cm?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_movable?: boolean
          is_placed?: boolean | null
          kind?: Database["public"]["Enums"]["feature_kind"]
          label?: string
          plan_x_pct?: number | null
          plan_y_pct?: number | null
          position_pct?: number | null
          room_id?: string
          source?: string
          status?: Database["public"]["Enums"]["point_status"]
          updated_at?: string
          wall_id?: string | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_features_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
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
      room_item_sizes: {
        Row: {
          depth_cm: number | null
          diameter_cm: number | null
          extra: Json
          height_cm: number | null
          item_id: string
          kind: Database["public"]["Enums"]["size_kind"]
          measured_at: string | null
          measured_by: string | null
          status: Database["public"]["Enums"]["size_status"]
          updated_at: string
          width_cm: number | null
        }
        Insert: {
          depth_cm?: number | null
          diameter_cm?: number | null
          extra?: Json
          height_cm?: number | null
          item_id: string
          kind: Database["public"]["Enums"]["size_kind"]
          measured_at?: string | null
          measured_by?: string | null
          status?: Database["public"]["Enums"]["size_status"]
          updated_at?: string
          width_cm?: number | null
        }
        Update: {
          depth_cm?: number | null
          diameter_cm?: number | null
          extra?: Json
          height_cm?: number | null
          item_id?: string
          kind?: Database["public"]["Enums"]["size_kind"]
          measured_at?: string | null
          measured_by?: string | null
          status?: Database["public"]["Enums"]["size_status"]
          updated_at?: string
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_item_sizes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "room_items"
            referencedColumns: ["id"]
          },
        ]
      }
      room_items: {
        Row: {
          action: Database["public"]["Enums"]["item_action"]
          chosen_product_id: string | null
          created_at: string
          currency: string
          decision: Database["public"]["Enums"]["keep_change"]
          delivery_notes: string | null
          furniture_spec_id: string | null
          id: string
          item_type: string
          label: string
          lead_time_days: number | null
          light_layer: Database["public"]["Enums"]["light_layer"] | null
          material_label: string | null
          plan_x_pct: number | null
          plan_y_pct: number | null
          position_fixed: boolean
          product_id: string | null
          quantity: number
          quantity_note: string | null
          room_id: string
          rotation_deg: number | null
          scheme_id: string | null
          shop_product_id: string | null
          sort_order: number
          source: Database["public"]["Enums"]["item_source"]
          sourcing: string | null
          supplier: string | null
          unit_price: number | null
          updated_at: string
          wall_id: string | null
        }
        Insert: {
          action?: Database["public"]["Enums"]["item_action"]
          chosen_product_id?: string | null
          created_at?: string
          currency?: string
          decision?: Database["public"]["Enums"]["keep_change"]
          delivery_notes?: string | null
          furniture_spec_id?: string | null
          id?: string
          item_type: string
          label: string
          lead_time_days?: number | null
          light_layer?: Database["public"]["Enums"]["light_layer"] | null
          material_label?: string | null
          plan_x_pct?: number | null
          plan_y_pct?: number | null
          position_fixed?: boolean
          product_id?: string | null
          quantity?: number
          quantity_note?: string | null
          room_id: string
          rotation_deg?: number | null
          scheme_id?: string | null
          shop_product_id?: string | null
          sort_order?: number
          source?: Database["public"]["Enums"]["item_source"]
          sourcing?: string | null
          supplier?: string | null
          unit_price?: number | null
          updated_at?: string
          wall_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["item_action"]
          chosen_product_id?: string | null
          created_at?: string
          currency?: string
          decision?: Database["public"]["Enums"]["keep_change"]
          delivery_notes?: string | null
          furniture_spec_id?: string | null
          id?: string
          item_type?: string
          label?: string
          lead_time_days?: number | null
          light_layer?: Database["public"]["Enums"]["light_layer"] | null
          material_label?: string | null
          plan_x_pct?: number | null
          plan_y_pct?: number | null
          position_fixed?: boolean
          product_id?: string | null
          quantity?: number
          quantity_note?: string | null
          room_id?: string
          rotation_deg?: number | null
          scheme_id?: string | null
          shop_product_id?: string | null
          sort_order?: number
          source?: Database["public"]["Enums"]["item_source"]
          sourcing?: string | null
          supplier?: string | null
          unit_price?: number | null
          updated_at?: string
          wall_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_items_chosen_product_id_fkey"
            columns: ["chosen_product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_items_furniture_spec_id_fkey"
            columns: ["furniture_spec_id"]
            isOneToOne: false
            referencedRelation: "furniture_specs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_items_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_items_shop_product_id_fkey"
            columns: ["shop_product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      room_layout_options: {
        Row: {
          cons: string[]
          created_at: string
          description: string | null
          id: string
          is_chosen: boolean
          items: Json
          name: string
          option_no: number
          pros: string[]
          room_id: string
          seats: number | null
        }
        Insert: {
          cons?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_chosen?: boolean
          items?: Json
          name: string
          option_no: number
          pros?: string[]
          room_id: string
          seats?: number | null
        }
        Update: {
          cons?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_chosen?: boolean
          items?: Json
          name?: string
          option_no?: number
          pros?: string[]
          room_id?: string
          seats?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_layout_options_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_materials: {
        Row: {
          applies_to: string[]
          color_term_id: string | null
          hex: string | null
          id: string
          label: string
          material_term_id: string | null
          material_visual_id: string | null
          room_id: string
          sample_status: Database["public"]["Enums"]["sample_status"]
          slot: number
        }
        Insert: {
          applies_to?: string[]
          color_term_id?: string | null
          hex?: string | null
          id?: string
          label: string
          material_term_id?: string | null
          material_visual_id?: string | null
          room_id: string
          sample_status?: Database["public"]["Enums"]["sample_status"]
          slot: number
        }
        Update: {
          applies_to?: string[]
          color_term_id?: string | null
          hex?: string | null
          id?: string
          label?: string
          material_term_id?: string | null
          material_visual_id?: string | null
          room_id?: string
          sample_status?: Database["public"]["Enums"]["sample_status"]
          slot?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_materials_color_term_id_fkey"
            columns: ["color_term_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_materials_material_term_id_fkey"
            columns: ["material_term_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_materials_material_visual_id_fkey"
            columns: ["material_visual_id"]
            isOneToOne: false
            referencedRelation: "material_visuals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_materials_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_priorities: {
        Row: {
          label: string | null
          priority_key: string
          rank: number
          room_id: string
        }
        Insert: {
          label?: string | null
          priority_key: string
          rank: number
          room_id: string
        }
        Update: {
          label?: string | null
          priority_key?: string
          rank?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_priorities_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_scope: {
        Row: {
          allow_changes: boolean
          area: string
          mode: Database["public"]["Enums"]["scope_mode"]
          note: string | null
          room_id: string
        }
        Insert: {
          allow_changes?: boolean
          area: string
          mode: Database["public"]["Enums"]["scope_mode"]
          note?: string | null
          room_id: string
        }
        Update: {
          allow_changes?: boolean
          area?: string
          mode?: Database["public"]["Enums"]["scope_mode"]
          note?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_scope_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_service_points: {
        Row: {
          confirmed_by: Database["public"]["Enums"]["collaborator_role"] | null
          created_at: string
          height_cm: number | null
          id: string
          notes: string | null
          point_code: string | null
          point_type: string
          position_pct: number | null
          quantity: number
          room_id: string
          serves_item_id: string | null
          service: Database["public"]["Enums"]["service_kind"]
          status: Database["public"]["Enums"]["point_status"]
          updated_at: string
          wall_id: string | null
        }
        Insert: {
          confirmed_by?: Database["public"]["Enums"]["collaborator_role"] | null
          created_at?: string
          height_cm?: number | null
          id?: string
          notes?: string | null
          point_code?: string | null
          point_type: string
          position_pct?: number | null
          quantity?: number
          room_id: string
          serves_item_id?: string | null
          service: Database["public"]["Enums"]["service_kind"]
          status?: Database["public"]["Enums"]["point_status"]
          updated_at?: string
          wall_id?: string | null
        }
        Update: {
          confirmed_by?: Database["public"]["Enums"]["collaborator_role"] | null
          created_at?: string
          height_cm?: number | null
          id?: string
          notes?: string | null
          point_code?: string | null
          point_type?: string
          position_pct?: number | null
          quantity?: number
          room_id?: string
          serves_item_id?: string | null
          service?: Database["public"]["Enums"]["service_kind"]
          status?: Database["public"]["Enums"]["point_status"]
          updated_at?: string
          wall_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_service_points_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_service_points_serves_item_id_fkey"
            columns: ["serves_item_id"]
            isOneToOne: false
            referencedRelation: "room_items"
            referencedColumns: ["id"]
          },
        ]
      }
      room_walls: {
        Row: {
          change_note: string | null
          elevation_ready: boolean
          finish: string | null
          name: string | null
          reviewed_at: string | null
          room_id: string
          status: Database["public"]["Enums"]["wall_review_status"]
          wall_id: string
        }
        Insert: {
          change_note?: string | null
          elevation_ready?: boolean
          finish?: string | null
          name?: string | null
          reviewed_at?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["wall_review_status"]
          wall_id: string
        }
        Update: {
          change_note?: string | null
          elevation_ready?: boolean
          finish?: string | null
          name?: string | null
          reviewed_at?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["wall_review_status"]
          wall_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_walls_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          ceiling_height_cm: number | null
          created_at: string
          current_step: number
          custom_walls: Json | null
          dimensions: Json
          floor_plan_analysis_id: string | null
          furniture: Json
          id: string
          inspiration_note: string | null
          layout: Json | null
          name: string
          project_id: string | null
          room_type: string
          scale_reference: Json | null
          schema_version: number
          sequence_no: number | null
          shape: string
          starting_state: Database["public"]["Enums"]["room_starting_state"] | null
          style: Json
          updated_at: string
          user_id: string
          walls: Json
        }
        Insert: {
          ceiling_height_cm?: number | null
          created_at?: string
          current_step?: number
          custom_walls?: Json | null
          dimensions?: Json
          floor_plan_analysis_id?: string | null
          furniture?: Json
          id?: string
          inspiration_note?: string | null
          layout?: Json | null
          name?: string
          project_id?: string | null
          room_type?: string
          scale_reference?: Json | null
          schema_version?: number
          sequence_no?: number | null
          shape?: string
          starting_state?: Database["public"]["Enums"]["room_starting_state"] | null
          style?: Json
          updated_at?: string
          user_id: string
          walls?: Json
        }
        Update: {
          ceiling_height_cm?: number | null
          created_at?: string
          current_step?: number
          custom_walls?: Json | null
          dimensions?: Json
          floor_plan_analysis_id?: string | null
          furniture?: Json
          id?: string
          inspiration_note?: string | null
          layout?: Json | null
          name?: string
          project_id?: string | null
          room_type?: string
          scale_reference?: Json | null
          schema_version?: number
          sequence_no?: number | null
          shape?: string
          starting_state?: Database["public"]["Enums"]["room_starting_state"] | null
          style?: Json
          updated_at?: string
          user_id?: string
          walls?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_plan_analysis_id_fkey"
            columns: ["floor_plan_analysis_id"]
            isOneToOne: false
            referencedRelation: "floor_plan_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scheme_combination_members: {
        Row: {
          combination_id: string
          role: string
          scheme_id: string
        }
        Insert: {
          combination_id: string
          role?: string
          scheme_id: string
        }
        Update: {
          combination_id?: string
          role?: string
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheme_combination_members_combination_id_fkey"
            columns: ["combination_id"]
            isOneToOne: false
            referencedRelation: "scheme_combinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheme_combination_members_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      scheme_combinations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ingest_batch_id: string | null
          member_count: number
          member_signature: string
          name: string | null
          notes: string | null
          room_type_facet: Database["public"]["Enums"]["term_facet"]
          room_type_id: string | null
          source: string
          status: string
          style_facet: Database["public"]["Enums"]["term_facet"]
          style_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingest_batch_id?: string | null
          member_count?: number
          member_signature?: string
          name?: string | null
          notes?: string | null
          room_type_facet?: Database["public"]["Enums"]["term_facet"]
          room_type_id?: string | null
          source?: string
          status?: string
          style_facet?: Database["public"]["Enums"]["term_facet"]
          style_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingest_batch_id?: string | null
          member_count?: number
          member_signature?: string
          name?: string | null
          notes?: string | null
          room_type_facet?: Database["public"]["Enums"]["term_facet"]
          room_type_id?: string | null
          source?: string
          status?: string
          style_facet?: Database["public"]["Enums"]["term_facet"]
          style_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheme_combinations_ingest_batch_id_fkey"
            columns: ["ingest_batch_id"]
            isOneToOne: false
            referencedRelation: "ingest_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheme_combinations_room_type_id_room_type_facet_fkey"
            columns: ["room_type_id", "room_type_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
          {
            foreignKeyName: "scheme_combinations_style_id_style_facet_fkey"
            columns: ["style_id", "style_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
        ]
      }
      scope_defaults: {
        Row: {
          area: string
          hint: string | null
          mode: Database["public"]["Enums"]["scope_mode"]
          starting_state: Database["public"]["Enums"]["room_starting_state"]
        }
        Insert: {
          area: string
          hint?: string | null
          mode: Database["public"]["Enums"]["scope_mode"]
          starting_state: Database["public"]["Enums"]["room_starting_state"]
        }
        Update: {
          area?: string
          hint?: string | null
          mode?: Database["public"]["Enums"]["scope_mode"]
          starting_state?: Database["public"]["Enums"]["room_starting_state"]
        }
        Relationships: []
      }
      settings_versions: {
        Row: {
          content_type: string | null
          id: number
          key: string
          saved_at: string
          saved_by: string | null
          value: string
        }
        Insert: {
          content_type?: string | null
          id?: number
          key: string
          saved_at?: string
          saved_by?: string | null
          value: string
        }
        Update: {
          content_type?: string | null
          id?: number
          key?: string
          saved_at?: string
          saved_by?: string | null
          value?: string
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
          scheme_id: string | null
          shop_id: string
          shop_ref: string | null
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
          scheme_id?: string | null
          shop_id: string
          shop_ref?: string | null
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
          scheme_id?: string | null
          shop_id?: string
          shop_ref?: string | null
          source_url?: string | null
          style?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "furniture_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_products_shop_ref_fkey"
            columns: ["shop_ref"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_scrape_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          products_found: number
          shop_id: string
          started_at: string
          started_by: string | null
          status: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          products_found?: number
          shop_id: string
          started_at?: string
          started_by?: string | null
          status?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          products_found?: number
          shop_id?: string
          started_at?: string
          started_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_scrape_runs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
      shops: {
        Row: {
          added_by: string | null
          created_at: string
          domain: string | null
          id: string
          kind: Database["public"]["Enums"]["shop_kind"]
          last_scraped_at: string | null
          name: string
          owner_user_id: string | null
          product_count: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["shop_status"]
          terms_checked: boolean
          updated_at: string
          url: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["shop_kind"]
          last_scraped_at?: string | null
          name: string
          owner_user_id?: string | null
          product_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shop_status"]
          terms_checked?: boolean
          updated_at?: string
          url?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["shop_kind"]
          last_scraped_at?: string | null
          name?: string
          owner_user_id?: string | null
          product_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["shop_status"]
          terms_checked?: boolean
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      signal_weights: {
        Row: {
          signal: Database["public"]["Enums"]["combination_signal"]
          weight: number
        }
        Insert: {
          signal: Database["public"]["Enums"]["combination_signal"]
          weight: number
        }
        Update: {
          signal?: Database["public"]["Enums"]["combination_signal"]
          weight?: number
        }
        Relationships: []
      }
      step_progress: {
        Row: {
          completed_at: string | null
          id: string
          project_id: string
          room_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["step_status"]
          step_no: number
          sub_step: string | null
          summary: Json
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          project_id: string
          room_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step_no: number
          sub_step?: string | null
          summary?: Json
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          project_id?: string
          room_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step_no?: number
          sub_step?: string | null
          summary?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_progress_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      style_definitions: {
        Row: {
          default_palette_id: string | null
          description: string | null
          mood_keywords: string[]
          prompt_fragment: string | null
          style_facet: Database["public"]["Enums"]["term_facet"]
          style_id: string
        }
        Insert: {
          default_palette_id?: string | null
          description?: string | null
          mood_keywords?: string[]
          prompt_fragment?: string | null
          style_facet?: Database["public"]["Enums"]["term_facet"]
          style_id: string
        }
        Update: {
          default_palette_id?: string | null
          description?: string | null
          mood_keywords?: string[]
          prompt_fragment?: string | null
          style_facet?: Database["public"]["Enums"]["term_facet"]
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_definitions_default_palette_id_fkey"
            columns: ["default_palette_id"]
            isOneToOne: false
            referencedRelation: "palettes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_definitions_style_id_style_facet_fkey"
            columns: ["style_id", "style_facet"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id", "facet"]
          },
        ]
      }
      style_matches: {
        Row: {
          created_at: string
          id: string
          is_selected: boolean
          kept_keywords: string[]
          keywords: string[]
          match_pct: number
          room_id: string
          style_label: string
          style_slug: string
          style_term_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_selected?: boolean
          kept_keywords?: string[]
          keywords?: string[]
          match_pct: number
          room_id: string
          style_label: string
          style_slug: string
          style_term_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_selected?: boolean
          kept_keywords?: string[]
          keywords?: string[]
          match_pct?: number
          room_id?: string
          style_label?: string
          style_slug?: string
          style_term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "style_matches_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_matches_style_term_id_fkey"
            columns: ["style_term_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
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
      taxonomy_terms: {
        Row: {
          created_at: string
          facet: Database["public"]["Enums"]["term_facet"]
          hex: string | null
          id: string
          is_active: boolean
          label: string
          parent_id: string | null
          proposed_from: string | null
          slug: string
          status: Database["public"]["Enums"]["term_status"]
          synonyms: string[]
        }
        Insert: {
          created_at?: string
          facet: Database["public"]["Enums"]["term_facet"]
          hex?: string | null
          id?: string
          is_active?: boolean
          label: string
          parent_id?: string | null
          proposed_from?: string | null
          slug: string
          status?: Database["public"]["Enums"]["term_status"]
          synonyms?: string[]
        }
        Update: {
          created_at?: string
          facet?: Database["public"]["Enums"]["term_facet"]
          hex?: string | null
          id?: string
          is_active?: boolean
          label?: string
          parent_id?: string | null
          proposed_from?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["term_status"]
          synonyms?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_terms_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_terms_proposed_from_fkey"
            columns: ["proposed_from"]
            isOneToOne: false
            referencedRelation: "detected_pieces"
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
      mv_combination_scores: {
        Row: {
          combination_id: string | null
          last_signal_at: string | null
          member_count: number | null
          name: string | null
          negative: number | null
          positive: number | null
          score: number | null
          users: number | null
        }
        Relationships: []
      }
      mv_scheme_pair_scores: {
        Row: {
          combinations: number | null
          negative: number | null
          positive: number | null
          scheme_a: string | null
          scheme_b: string | null
          score: number | null
        }
        Relationships: []
      }
      mv_term_pair_scores: {
        Row: {
          combinations: number | null
          negative: number | null
          positive: number | null
          score: number | null
          term_a: string | null
          term_b: string | null
        }
        Relationships: []
      }
      v_buying_list: {
        Row: {
          action: Database["public"]["Enums"]["item_action"] | null
          appr_d: number | null
          appr_h: number | null
          appr_w: number | null
          avail_d: number | null
          avail_h: number | null
          avail_w: number | null
          currency: string | null
          item_id: string | null
          item_type: string | null
          label: string | null
          lead_time_days: number | null
          project_id: string | null
          quantity: number | null
          quantity_note: string | null
          room_id: string | null
          size_status: Database["public"]["Enums"]["size_status"] | null
          std_d: number | null
          std_h: number | null
          std_w: number | null
          supplier: string | null
          unit_price: number | null
          wall_id: string | null
        }
        Relationships: []
      }
      v_furniture_schemes: {
        Row: {
          category: string | null
          color: string | null
          descriptor: string | null
          hex: string | null
          id: string | null
          label: string | null
          material: string | null
          other_tags: string[] | null
          source: string | null
          style: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invite: { Args: { invite_token: string }; Returns: boolean }
      add_project_shop: { Args: { _project: string; _url: string }; Returns: Json[] }
      admin_refresh_scores: { Args: never; Returns: string }
      apply_scope_defaults: { Args: { _room_id: string }; Returns: undefined }
      can_access_project: { Args: { _project_id: string }; Returns: boolean }
      can_access_room: { Args: { _room_id: string }; Returns: boolean }
      can_edit_room: { Args: { _room_id: string }; Returns: boolean }
      can_read_shop: { Args: { _shop: string; _user: string }; Returns: boolean }
      deduct_credits: { Args: { _amount: number; _user_id: string }; Returns: boolean }
      get_user_role: { Args: { _user_id: string }; Returns: Database["public"]["Enums"]["app_role"] }
      has_role: { Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }; Returns: boolean }
      is_privileged_caller: { Args: never; Returns: boolean }
      is_project_owner: { Args: { _project_id: string }; Returns: boolean }
      merge_terms: { Args: { _drop: string; _keep: string }; Returns: undefined }
      project_shop_ids: { Args: { _project_id: string }; Returns: string[] }
      propose_term: { Args: { _facet: Database["public"]["Enums"]["term_facet"]; _piece: string; _text: string }; Returns: string }
      refresh_ingest_batch: { Args: { _batch: string }; Returns: undefined }
      refresh_scheme_scores: { Args: never; Returns: undefined }
      resolve_term: { Args: { _facet: Database["public"]["Enums"]["term_facet"]; _text: string }; Returns: string }
      save_detected_piece: { Args: { _confirmed: boolean; _piece: string }; Returns: string }
      save_ingest_combination: { Args: { _item: string }; Returns: string }
      term: { Args: { _facet: Database["public"]["Enums"]["term_facet"]; _slug: string }; Returns: string }
      undo_ingest_batch: { Args: { _batch: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "designer" | "furniture_shop" | "user"
      collaborator_role: "designer" | "joiner" | "electrician" | "plumber" | "ac_installer" | "flooring_curtains" | "decorator" | "other"
      combination_signal: "curated" | "generated" | "kept_in_design" | "changed_in_design" | "liked" | "disliked" | "bought_together" | "expert_approved" | "expert_rejected"
      deliverable_kind: "design_review" | "buying_pack" | "installation_pack" | "project_checklist" | "moodboard"
      deliverable_status: "ready" | "needs_sizes" | "after_survey" | "generating"
      feature_kind: "window" | "door" | "balcony_door" | "archway" | "radiator" | "column" | "built_in" | "socket_switch" | "water_supply_drain" | "soil_stack" | "ac_unit_vent" | "fuse_box_meter" | "other"
      invite_status: "pending" | "accepted" | "expired"
      item_action: "buy" | "keep" | "custom" | "own_or_buy" | "buy_or_keep"
      item_source: "existing_kept" | "proposed" | "user_added"
      keep_change: "keep" | "change" | "skip"
      light_layer: "overall" | "task" | "accent"
      media_subject: "room" | "inspiration" | "room_item" | "room_feature" | "room_wall" | "room_service"
      notification_preference: "email" | "whatsapp" | "both"
      offer_status: "pending" | "sent" | "viewed" | "accepted" | "rejected"
      point_status: "existing" | "proposed" | "tbc" | "confirmed"
      project_intent: "new_space" | "redesign" | "exploring"
      property_type: "apartment" | "house" | "studio" | "loft"
      remark_category: "interior_finishes" | "furniture" | "colours_materials" | "decor" | "lighting"
      room_starting_state: "core_shell" | "empty" | "partially_furnished" | "redo_all"
      sample_status: "none" | "requested" | "received" | "approved"
      scope_mode: "in_scope" | "on_request" | "kept_as_is"
      service_kind: "electrical" | "water" | "ac_ventilation" | "heating" | "data_tv_sound"
      shop_kind: "partner" | "user_added"
      shop_status: "pending" | "approved" | "rejected" | "unreadable"
      size_kind: "standard" | "available" | "approved"
      size_status: "standard" | "edited" | "measured" | "approved"
      step_status: "not_started" | "in_progress" | "completed" | "skipped"
      task_status: "todo" | "in_progress" | "done" | "blocked"
      term_facet: "category" | "color" | "style" | "material" | "finish" | "shape" | "pattern" | "mood" | "room_type" | "other"
      term_status: "proposed" | "active" | "retired"
      wall_review_status: "to_review" | "kept" | "changed"
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
      collaborator_role: ["designer", "joiner", "electrician", "plumber", "ac_installer", "flooring_curtains", "decorator", "other"],
      combination_signal: ["curated", "generated", "kept_in_design", "changed_in_design", "liked", "disliked", "bought_together", "expert_approved", "expert_rejected"],
      deliverable_kind: ["design_review", "buying_pack", "installation_pack", "project_checklist", "moodboard"],
      deliverable_status: ["ready", "needs_sizes", "after_survey", "generating"],
      feature_kind: ["window", "door", "balcony_door", "archway", "radiator", "column", "built_in", "socket_switch", "water_supply_drain", "soil_stack", "ac_unit_vent", "fuse_box_meter", "other"],
      invite_status: ["pending", "accepted", "expired"],
      item_action: ["buy", "keep", "custom", "own_or_buy", "buy_or_keep"],
      item_source: ["existing_kept", "proposed", "user_added"],
      keep_change: ["keep", "change", "skip"],
      light_layer: ["overall", "task", "accent"],
      media_subject: ["room", "inspiration", "room_item", "room_feature", "room_wall", "room_service"],
      notification_preference: ["email", "whatsapp", "both"],
      offer_status: ["pending", "sent", "viewed", "accepted", "rejected"],
      point_status: ["existing", "proposed", "tbc", "confirmed"],
      project_intent: ["new_space", "redesign", "exploring"],
      property_type: ["apartment", "house", "studio", "loft"],
      remark_category: ["interior_finishes", "furniture", "colours_materials", "decor", "lighting"],
      room_starting_state: ["core_shell", "empty", "partially_furnished", "redo_all"],
      sample_status: ["none", "requested", "received", "approved"],
      scope_mode: ["in_scope", "on_request", "kept_as_is"],
      service_kind: ["electrical", "water", "ac_ventilation", "heating", "data_tv_sound"],
      shop_kind: ["partner", "user_added"],
      shop_status: ["pending", "approved", "rejected", "unreadable"],
      size_kind: ["standard", "available", "approved"],
      size_status: ["standard", "edited", "measured", "approved"],
      step_status: ["not_started", "in_progress", "completed", "skipped"],
      task_status: ["todo", "in_progress", "done", "blocked"],
      term_facet: ["category", "color", "style", "material", "finish", "shape", "pattern", "mood", "room_type", "other"],
      term_status: ["proposed", "active", "retired"],
      wall_review_status: ["to_review", "kept", "changed"],
    },
  },
} as const
