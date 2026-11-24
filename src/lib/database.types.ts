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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      children: {
        Row: {
          birth_date: string
          created_at: string
          favourites: string | null
          household_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          favourites?: string | null
          household_id?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          favourites?: string | null
          household_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      global_ideas: {
        Row: {
          content: Json
          created_at: string
          id: string
          model: string
          name: string
          pitch: string
          place_description: string | null
          setting: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          model: string
          name: string
          pitch: string
          place_description?: string | null
          setting: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          model?: string
          name?: string
          pitch?: string
          place_description?: string | null
          setting?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          display_name: string | null
          household_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          household_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          household_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      idea_players: {
        Row: {
          child_id: string | null
          household_id: string
          id: string
          idea_id: string
          user_id: string | null
        }
        Insert: {
          child_id?: string | null
          household_id?: string
          id?: string
          idea_id: string
          user_id?: string | null
        }
        Update: {
          child_id?: string | null
          household_id?: string
          id?: string
          idea_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_players_household_id_child_id_fkey"
            columns: ["household_id", "child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "idea_players_household_id_idea_id_fkey"
            columns: ["household_id", "idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "idea_players_household_id_user_id_fkey"
            columns: ["household_id", "user_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["household_id", "user_id"]
          },
        ]
      }
      idea_ratings: {
        Row: {
          household_id: string
          idea_id: string
          rated_at: string
          user_id: string
          value: number
        }
        Insert: {
          household_id?: string
          idea_id: string
          rated_at?: string
          user_id?: string
          value: number
        }
        Update: {
          household_id?: string
          idea_id?: string
          rated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "idea_ratings_household_id_idea_id_fkey"
            columns: ["household_id", "idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "idea_ratings_household_id_user_id_fkey"
            columns: ["household_id", "user_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["household_id", "user_id"]
          },
        ]
      }
      idea_toys: {
        Row: {
          household_id: string
          idea_id: string
          toy_id: string
        }
        Insert: {
          household_id?: string
          idea_id: string
          toy_id: string
        }
        Update: {
          household_id?: string
          idea_id?: string
          toy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_toys_household_id_idea_id_fkey"
            columns: ["household_id", "idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["household_id", "id"]
          },
          {
            foreignKeyName: "idea_toys_household_id_toy_id_fkey"
            columns: ["household_id", "toy_id"]
            isOneToOne: false
            referencedRelation: "toys"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string
          created_by: string | null
          global_idea_id: string
          household_id: string
          id: string
          local: Json
          saved_at: string | null
          setting: string
          supervise_closely: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          global_idea_id: string
          household_id?: string
          id?: string
          local?: Json
          saved_at?: string | null
          setting?: string
          supervise_closely?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          global_idea_id?: string
          household_id?: string
          id?: string
          local?: Json
          saved_at?: string | null
          setting?: string
          supervise_closely?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ideas_global_idea_id_fkey"
            columns: ["global_idea_id"]
            isOneToOne: false
            referencedRelation: "global_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          created_at: string
          household_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "places_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      play_locations: {
        Row: {
          created_at: string
          household_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          household_id?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      toys: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          location_hint: string | null
          name: string
          place_id: string
          small_parts: boolean
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          location_hint?: string | null
          name: string
          place_id: string
          small_parts?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          location_hint?: string | null
          name?: string
          place_id?: string
          small_parts?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toys_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toys_household_id_place_id_fkey"
            columns: ["household_id", "place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_household: {
        Args: { household_name: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_invite_code: { Args: never; Returns: string }
      is_household_member: { Args: { hid: string }; Returns: boolean }
      join_household: {
        Args: { code: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      match_ideas: {
        Args: {
          chosen_child_ids: string[]
          chosen_setting: string
          chosen_toy_ids: string[]
        }
        Returns: {
          all_toys_chosen: boolean
          idea_id: string
          same_players: boolean
          score: number
          shared_toys: number
        }[]
      }
      match_saved_ideas: {
        Args: { chosen_child_ids: string[]; chosen_toy_ids: string[] }
        Returns: {
          all_toys_chosen: boolean
          idea_id: string
          same_players: boolean
          score: number
          shared_toys: number
        }[]
      }
      my_household_id: { Args: never; Returns: string }
      save_idea: {
        Args: {
          child_ids: string[]
          generic_content: Json
          generic_place_description: string
          generic_setting: string
          idea_model: string
          idea_name: string
          idea_pitch: string
          local_content: Json
          local_setting: string
          parent_ids: string[]
          supervise: boolean
          toy_ids: string[]
        }
        Returns: string
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
    Enums: {},
  },
} as const
