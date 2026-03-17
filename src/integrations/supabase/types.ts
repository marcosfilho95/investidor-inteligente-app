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
      dataset_meta: {
        Row: {
          checksum: string | null
          created_at: string
          dataset_name: string
          file_path: string
          id: string
          message: string | null
          row_count: number
          status: string
          version_date: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          dataset_name: string
          file_path: string
          id?: string
          message?: string | null
          row_count?: number
          status?: string
          version_date: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          dataset_name?: string
          file_path?: string
          id?: string
          message?: string | null
          row_count?: number
          status?: string
          version_date?: string
        }
        Relationships: []
      }
      price_cache: {
        Row: {
          cdi_annual: number | null
          current_price: number
          ibov_return_12m: number | null
          ibov_return_30d: number | null
          ibov_return_7d: number | null
          id: string
          ipca_12m: number | null
          price_12m_ago: number | null
          price_30d_ago: number | null
          price_7d_ago: number | null
          return_12m: number | null
          return_30d: number | null
          return_7d: number | null
          symbol: string
          updated_at: string
        }
        Insert: {
          cdi_annual?: number | null
          current_price?: number
          ibov_return_12m?: number | null
          ibov_return_30d?: number | null
          ibov_return_7d?: number | null
          id?: string
          ipca_12m?: number | null
          price_12m_ago?: number | null
          price_30d_ago?: number | null
          price_7d_ago?: number | null
          return_12m?: number | null
          return_30d?: number | null
          return_7d?: number | null
          symbol: string
          updated_at?: string
        }
        Update: {
          cdi_annual?: number | null
          current_price?: number
          ibov_return_12m?: number | null
          ibov_return_30d?: number | null
          ibov_return_7d?: number | null
          id?: string
          ipca_12m?: number | null
          price_12m_ago?: number | null
          price_30d_ago?: number | null
          price_7d_ago?: number | null
          return_12m?: number | null
          return_30d?: number | null
          return_7d?: number | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_type: string
          cooldown_days: number
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          last_reference_value: number
          last_shown_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          cooldown_days?: number
          created_at?: string
          entity_id?: string
          entity_type: string
          id?: string
          last_reference_value?: number
          last_shown_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          cooldown_days?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_reference_value?: number
          last_shown_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          investor_profile_answers: Json | null
          investor_profile_created_at: string | null
          investor_profile_score: number | null
          investor_profile_type: string | null
          investor_profile_updated_at: string | null
          name: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          investor_profile_answers?: Json | null
          investor_profile_created_at?: string | null
          investor_profile_score?: number | null
          investor_profile_type?: string | null
          investor_profile_updated_at?: string | null
          name?: string
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          investor_profile_answers?: Json | null
          investor_profile_created_at?: string | null
          investor_profile_score?: number | null
          investor_profile_type?: string | null
          investor_profile_updated_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_alert_state: {
        Row: {
          created_at: string
          last_login_at: string | null
          last_session_fingerprint: string | null
          login_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_login_at?: string | null
          last_session_fingerprint?: string | null
          login_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_login_at?: string | null
          last_session_fingerprint?: string | null
          login_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_trades: {
        Row: {
          created_at: string
          id: string
          price: number
          shares: number
          side: string
          symbol: string
          traded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          shares: number
          side: string
          symbol: string
          traded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          shares?: number
          side?: string
          symbol?: string
          traded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_holdings: {
        Row: {
          avg_price: number
          created_at: string
          id: string
          shares: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          created_at?: string
          id?: string
          shares?: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          created_at?: string
          id?: string
          shares?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_login_count_if_new: {
        Args: {
          p_session_fingerprint: string
        }
        Returns: number
      }
      get_email_by_username: {
        Args: {
          p_username: string
        }
        Returns: string | null
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
