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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      combo_group_items: {
        Row: {
          combo_group_id: string
          menu_item_id: string
        }
        Insert: {
          combo_group_id: string
          menu_item_id: string
        }
        Update: {
          combo_group_id?: string
          menu_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_group_items_combo_group_id_fkey"
            columns: ["combo_group_id"]
            isOneToOne: false
            referencedRelation: "combo_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_group_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_groups: {
        Row: {
          id: string
          max_select: number
          menu_item_id: string
          name: string
          name_zh: string | null
          required: boolean
          sort_order: number
        }
        Insert: {
          id: string
          max_select?: number
          menu_item_id: string
          name: string
          name_zh?: string | null
          required?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          max_select?: number
          menu_item_id?: string
          name?: string
          name_zh?: string | null
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "combo_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_visit: string | null
          name: string
          phone: string
          points: number
          tier: Database["public"]["Enums"]["customer_tier"]
          updated_at: string
          visits: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          last_visit?: string | null
          name: string
          phone: string
          points?: number
          tier?: Database["public"]["Enums"]["customer_tier"]
          updated_at?: string
          visits?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit?: string | null
          name?: string
          phone?: string
          points?: number
          tier?: Database["public"]["Enums"]["customer_tier"]
          updated_at?: string
          visits?: number
        }
        Relationships: []
      }
      menu_item_modifier_groups: {
        Row: {
          menu_item_id: string
          modifier_group_id: string
        }
        Insert: {
          menu_item_id: string
          modifier_group_id: string
        }
        Update: {
          menu_item_id?: string
          modifier_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean
          category: string
          combo_includes: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_combo: boolean
          is_flex_combo: boolean
          name: string
          name_zh: string | null
          popular: boolean
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category: string
          combo_includes?: string[] | null
          created_at?: string
          description?: string | null
          id: string
          image_url?: string | null
          is_combo?: boolean
          is_flex_combo?: boolean
          name: string
          name_zh?: string | null
          popular?: boolean
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category?: string
          combo_includes?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_combo?: boolean
          is_flex_combo?: boolean
          name?: string
          name_zh?: string | null
          popular?: boolean
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      modifier_groups: {
        Row: {
          created_at: string
          id: string
          multi_select: boolean
          name: string
          name_zh: string | null
          required: boolean
        }
        Insert: {
          created_at?: string
          id: string
          multi_select?: boolean
          name: string
          name_zh?: string | null
          required?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          multi_select?: boolean
          name?: string
          name_zh?: string | null
          required?: boolean
        }
        Relationships: []
      }
      modifier_options: {
        Row: {
          created_at: string
          group_id: string
          id: string
          name: string
          name_zh: string | null
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id: string
          name: string
          name_zh?: string | null
          price?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          name_zh?: string | null
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifier_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          id: string
          name: string
          order_item_id: string
          price: number
        }
        Insert: {
          id?: string
          name: string
          order_item_id: string
          price?: number
        }
        Update: {
          id?: string
          name?: string
          order_item_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          combo_items: Json | null
          created_at: string
          fired_at: string | null
          id: string
          menu_item_id: string
          name: string
          notes: string | null
          order_id: string
          price: number
          quantity: number
          seat: number | null
          status: Database["public"]["Enums"]["kds_status"]
        }
        Insert: {
          combo_items?: Json | null
          created_at?: string
          fired_at?: string | null
          id: string
          menu_item_id: string
          name: string
          notes?: string | null
          order_id: string
          price: number
          quantity?: number
          seat?: number | null
          status?: Database["public"]["Enums"]["kds_status"]
        }
        Update: {
          combo_items?: Json | null
          created_at?: string
          fired_at?: string | null
          id?: string
          menu_item_id?: string
          name?: string
          notes?: string | null
          order_id?: string
          price?: number
          quantity?: number
          seat?: number | null
          status?: Database["public"]["Enums"]["kds_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          gst: number
          guest_count: number
          id: string
          service_charge: number
          service_mode: Database["public"]["Enums"]["service_mode"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          table_number: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          gst?: number
          guest_count?: number
          id: string
          service_charge?: number
          service_mode?: Database["public"]["Enums"]["service_mode"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          table_number?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          gst?: number
          guest_count?: number
          id?: string
          service_charge?: number
          service_mode?: Database["public"]["Enums"]["service_mode"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          table_number?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          created_at: string
          elapsed_minutes: number | null
          guest_count: number | null
          id: string
          merged_with: string[] | null
          number: string
          open_amount: number | null
          order_id: string | null
          reservation_name: string | null
          seats: number
          server: string | null
          status: Database["public"]["Enums"]["table_status"]
          updated_at: string
          zone: string
        }
        Insert: {
          created_at?: string
          elapsed_minutes?: number | null
          guest_count?: number | null
          id: string
          merged_with?: string[] | null
          number: string
          open_amount?: number | null
          order_id?: string | null
          reservation_name?: string | null
          seats?: number
          server?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          updated_at?: string
          zone: string
        }
        Update: {
          created_at?: string
          elapsed_minutes?: number | null
          guest_count?: number | null
          id?: string
          merged_with?: string[] | null
          number?: string
          open_amount?: number | null
          order_id?: string | null
          reservation_name?: string | null
          seats?: number
          server?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          pin: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          name: string
          pin: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          pin?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      customer_tier: "bronze" | "silver" | "gold" | "platinum"
      kds_status: "new" | "preparing" | "ready" | "served"
      order_status:
        | "open"
        | "sent"
        | "preparing"
        | "ready"
        | "served"
        | "paid"
        | "void"
      service_mode: "dine-in" | "takeaway" | "delivery" | "pickup"
      staff_role: "server" | "cashier" | "manager" | "kitchen"
      table_status:
        | "available"
        | "reserved"
        | "ordering"
        | "ordered"
        | "dirty"
        | "cleaning"
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
      customer_tier: ["bronze", "silver", "gold", "platinum"],
      kds_status: ["new", "preparing", "ready", "served"],
      order_status: [
        "open",
        "sent",
        "preparing",
        "ready",
        "served",
        "paid",
        "void",
      ],
      service_mode: ["dine-in", "takeaway", "delivery", "pickup"],
      staff_role: ["server", "cashier", "manager", "kitchen"],
      table_status: [
        "available",
        "reserved",
        "ordering",
        "ordered",
        "dirty",
        "cleaning",
      ],
    },
  },
} as const
