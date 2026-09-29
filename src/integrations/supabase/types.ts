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
      allocation_requests: {
        Row: {
          created_at: string
          id: string
          preferred_block: string | null
          preferred_room_type:
            | Database["public"]["Enums"]["room_type_enum"]
            | null
          reviewed_at: string | null
          special_request: string | null
          status: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_block?: string | null
          preferred_room_type?:
            | Database["public"]["Enums"]["room_type_enum"]
            | null
          reviewed_at?: string | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_block?: string | null
          preferred_room_type?:
            | Database["public"]["Enums"]["room_type_enum"]
            | null
          reviewed_at?: string | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string
        }
        Relationships: []
      }
      allocations: {
        Row: {
          allocated_at: string
          id: string
          room_id: string
          status: Database["public"]["Enums"]["allocation_status"]
          student_id: string
        }
        Insert: {
          allocated_at?: string
          id?: string
          room_id: string
          status?: Database["public"]["Enums"]["allocation_status"]
          student_id: string
        }
        Update: {
          allocated_at?: string
          id?: string
          room_id?: string
          status?: Database["public"]["Enums"]["allocation_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          course: string | null
          created_at: string
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          phone: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          course?: string | null
          created_at?: string
          email: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id: string
          phone?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          course?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          phone?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          block_name: string
          capacity: number
          created_at: string
          floor: number
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          occupied_beds: number
          room_number: string
          room_type: Database["public"]["Enums"]["room_type_enum"]
          status: Database["public"]["Enums"]["room_status"]
        }
        Insert: {
          block_name: string
          capacity: number
          created_at?: string
          floor: number
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          occupied_beds?: number
          room_number: string
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          status?: Database["public"]["Enums"]["room_status"]
        }
        Update: {
          block_name?: string
          capacity?: number
          created_at?: string
          floor?: number
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          occupied_beds?: number
          room_number?: string
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          status?: Database["public"]["Enums"]["room_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      allocation_status: "active" | "vacated"
      app_role: "student" | "admin"
      complaint_status: "open" | "in-progress" | "resolved"
      gender_type: "male" | "female" | "other"
      request_status: "pending" | "approved" | "rejected"
      room_status: "available" | "full" | "maintenance"
      room_type_enum: "single" | "double" | "triple" | "quad"
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
      allocation_status: ["active", "vacated"],
      app_role: ["student", "admin"],
      complaint_status: ["open", "in-progress", "resolved"],
      gender_type: ["male", "female", "other"],
      request_status: ["pending", "approved", "rejected"],
      room_status: ["available", "full", "maintenance"],
      room_type_enum: ["single", "double", "triple", "quad"],
    },
  },
} as const
