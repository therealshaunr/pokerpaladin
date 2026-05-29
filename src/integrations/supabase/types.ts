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
      addons: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["addon_kind"]
          status: Database["public"]["Enums"]["sub_status"]
          stripe_sub_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["addon_kind"]
          status?: Database["public"]["Enums"]["sub_status"]
          stripe_sub_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["addon_kind"]
          status?: Database["public"]["Enums"]["sub_status"]
          stripe_sub_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          id: string
          meta: Json | null
          target_user_id: string | null
          ts: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          id?: string
          meta?: Json | null
          target_user_id?: string | null
          ts?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          id?: string
          meta?: Json | null
          target_user_id?: string | null
          ts?: string
        }
        Relationships: []
      }
      hands: {
        Row: {
          board: Json | null
          decision: Json | null
          hero_cards: Json | null
          id: string
          pot: number | null
          session_id: string
          ts: string
          user_id: string
        }
        Insert: {
          board?: Json | null
          decision?: Json | null
          hero_cards?: Json | null
          id?: string
          pot?: number | null
          session_id: string
          ts?: string
          user_id: string
        }
        Update: {
          board?: Json | null
          decision?: Json | null
          hero_cards?: Json | null
          id?: string
          pot?: number | null
          session_id?: string
          ts?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hands_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_links: {
        Row: {
          claimed: boolean
          created_at: string
          expires_at: string
          id: string
          pair_code: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          pair_code: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          claimed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          pair_code?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_links_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          name: string | null
          phone: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_line1: string | null
          shipping_line2: string | null
          shipping_postal: string | null
          shipping_state: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          name?: string | null
          phone?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_line1?: string | null
          shipping_line2?: string | null
          shipping_postal?: string | null
          shipping_state?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_line1?: string | null
          shipping_line2?: string | null
          shipping_postal?: string | null
          shipping_state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scan_events: {
        Row: {
          id: string
          ms: number | null
          session_id: string | null
          tokens_in: number | null
          tokens_out: number | null
          ts: string
          user_id: string
        }
        Insert: {
          id?: string
          ms?: number | null
          session_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          ts?: string
          user_id: string
        }
        Update: {
          id?: string
          ms?: number | null
          session_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          ts?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
          variant: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
          variant: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
          variant?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activation_id: string
          created_at: string
          current_period_end: string | null
          frozen: boolean
          id: string
          interval: Database["public"]["Enums"]["sub_interval"]
          status: Database["public"]["Enums"]["sub_status"]
          stripe_customer_id: string | null
          stripe_sub_id: string | null
          suspended: boolean
          tier: Database["public"]["Enums"]["sub_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_id?: string
          created_at?: string
          current_period_end?: string | null
          frozen?: boolean
          id?: string
          interval?: Database["public"]["Enums"]["sub_interval"]
          status?: Database["public"]["Enums"]["sub_status"]
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          suspended?: boolean
          tier?: Database["public"]["Enums"]["sub_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_id?: string
          created_at?: string
          current_period_end?: string | null
          frozen?: boolean
          id?: string
          interval?: Database["public"]["Enums"]["sub_interval"]
          status?: Database["public"]["Enums"]["sub_status"]
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          suspended?: boolean
          tier?: Database["public"]["Enums"]["sub_tier"]
          updated_at?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      addon_kind: "extension" | "mobile_render"
      app_role: "admin" | "user"
      sub_interval: "monthly" | "quarterly" | "yearly"
      sub_status: "trialing" | "active" | "past_due" | "canceled" | "incomplete"
      sub_tier: "standard" | "pro"
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
      addon_kind: ["extension", "mobile_render"],
      app_role: ["admin", "user"],
      sub_interval: ["monthly", "quarterly", "yearly"],
      sub_status: ["trialing", "active", "past_due", "canceled", "incomplete"],
      sub_tier: ["standard", "pro"],
    },
  },
} as const
