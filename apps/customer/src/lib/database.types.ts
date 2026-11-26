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
      amenities: {
        Row: {
          code: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      attractions: {
        Row: {
          id: string
          is_active: boolean
          kind: string
          latitude: number
          longitude: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          kind: string
          latitude: number
          longitude: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          kind?: string
          latitude?: number
          longitude?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      daily_rates: {
        Row: {
          rate_paise: number
          room_type_id: string
          stay_date: string
        }
        Insert: {
          rate_paise: number
          room_type_id: string
          stay_date: string
        }
        Update: {
          rate_paise?: number
          room_type_id?: string
          stay_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rates_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_blocks: {
        Row: {
          blocked_units: number
          note: string | null
          room_type_id: string
          stay_date: string
          updated_at: string
        }
        Insert: {
          blocked_units: number
          note?: string | null
          room_type_id: string
          stay_date: string
          updated_at?: string
        }
        Update: {
          blocked_units?: number
          note?: string | null
          room_type_id?: string
          stay_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_blocks_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          discount_percent: number
          id: string
          property_id: string
          room_type_id: string | null
          status: Database["public"]["Enums"]["offer_status"]
          title: string
          updated_at: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percent: number
          id?: string
          property_id: string
          room_type_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title: string
          updated_at?: string
          valid_from: string
          valid_to: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percent?: number
          id?: string
          property_id?: string
          room_type_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          id: string
          provider: string
          provider_reference: string | null
          recorded_by: string | null
          reservation_id: string
          status: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          id?: string
          provider: string
          provider_reference?: string | null
          recorded_by?: string | null
          reservation_id: string
          status: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          id?: string
          provider?: string
          provider_reference?: string | null
          recorded_by?: string | null
          reservation_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          created_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          approx_latitude: number | null
          approx_longitude: number | null
          area: string
          cancellation_policy: string | null
          check_in_time: string
          check_out_time: string
          created_at: string
          created_by: string | null
          description: string | null
          house_rules: string | null
          id: string
          name: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          stay_style: Database["public"]["Enums"]["stay_style"]
          tagline: string | null
          updated_at: string
        }
        Insert: {
          approx_latitude?: number | null
          approx_longitude?: number | null
          area: string
          cancellation_policy?: string | null
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          house_rules?: string | null
          id?: string
          name: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["property_status"]
          stay_style: Database["public"]["Enums"]["stay_style"]
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          approx_latitude?: number | null
          approx_longitude?: number | null
          area?: string
          cancellation_policy?: string | null
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          house_rules?: string | null
          id?: string
          name?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["property_status"]
          stay_style?: Database["public"]["Enums"]["stay_style"]
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_amenities: {
        Row: {
          amenity_id: string
          property_id: string
        }
        Insert: {
          amenity_id: string
          property_id: string
        }
        Update: {
          amenity_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          property_id: string
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          property_id: string
          role: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          property_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "property_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_locations: {
        Row: {
          address_line: string
          arrival_instructions: string | null
          city: string
          contact_phone: string | null
          latitude: number
          longitude: number
          postal_code: string
          property_id: string
          state: string
          updated_at: string
        }
        Insert: {
          address_line: string
          arrival_instructions?: string | null
          city?: string
          contact_phone?: string | null
          latitude: number
          longitude: number
          postal_code?: string
          property_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          arrival_instructions?: string | null
          city?: string
          contact_phone?: string | null
          latitude?: number
          longitude?: number
          postal_code?: string
          property_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_locations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_members: {
        Row: {
          created_at: string
          invited_by: string | null
          property_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          property_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          property_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_members_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          attribution: string | null
          caption: string | null
          created_at: string
          id: string
          property_id: string
          room_type_id: string | null
          sort_order: number
          storage_path: string
        }
        Insert: {
          attribution?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          property_id: string
          room_type_id?: string | null
          sort_order?: number
          storage_path: string
        }
        Update: {
          attribution?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          property_id?: string
          room_type_id?: string | null
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_photos_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_nights: {
        Row: {
          rate_paise: number
          reservation_id: string
          stay_date: string
        }
        Insert: {
          rate_paise: number
          reservation_id: string
          stay_date: string
        }
        Update: {
          rate_paise?: number
          reservation_id?: string
          stay_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_nights_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          booking_fee_paise: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          created_at: string
          currency: string
          customer_id: string
          discount_paise: number
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guests: number
          id: string
          nights: number | null
          offer_code: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          property_id: string
          reference: string
          room_type_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          subtotal_paise: number
          taxes_paise: number
          total_paise: number
          units: number
          updated_at: string
        }
        Insert: {
          booking_fee_paise?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in: string
          check_out: string
          created_at?: string
          currency?: string
          customer_id: string
          discount_paise?: number
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          guests: number
          id?: string
          nights?: number | null
          offer_code?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id: string
          reference: string
          room_type_id: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          subtotal_paise: number
          taxes_paise?: number
          total_paise: number
          units?: number
          updated_at?: string
        }
        Update: {
          booking_fee_paise?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in?: string
          check_out?: string
          created_at?: string
          currency?: string
          customer_id?: string
          discount_paise?: number
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          guests?: number
          id?: string
          nights?: number | null
          offer_code?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id?: string
          reference?: string
          room_type_id?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          subtotal_paise?: number
          taxes_paise?: number
          total_paise?: number
          units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          accommodation_rating: number | null
          author_name: string | null
          cleanliness_rating: number | null
          comment: string | null
          connectivity_rating: number | null
          created_at: string
          customer_id: string
          id: string
          property_id: string
          rating: number
          reservation_id: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          accommodation_rating?: number | null
          author_name?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          connectivity_rating?: number | null
          created_at?: string
          customer_id: string
          id?: string
          property_id: string
          rating: number
          reservation_id: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          accommodation_rating?: number | null
          author_name?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          connectivity_rating?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          property_id?: string
          rating?: number
          reservation_id?: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          base_rate_paise: number
          bedrooms: number
          beds: string | null
          compare_at_paise: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_guests: number
          name: string
          property_id: string
          sort_order: number
          total_units: number
          updated_at: string
        }
        Insert: {
          base_rate_paise: number
          bedrooms?: number
          beds?: string | null
          compare_at_paise?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_guests: number
          name: string
          property_id: string
          sort_order?: number
          total_units?: number
          updated_at?: string
        }
        Update: {
          base_rate_paise?: number
          bedrooms?: number
          beds?: string | null
          compare_at_paise?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_guests?: number
          name?: string
          property_id?: string
          sort_order?: number
          total_units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          contact: string
          created_at: string
          id: string
          message: string
          name: string
          source: string
          user_id: string | null
        }
        Insert: {
          contact: string
          created_at?: string
          id?: string
          message: string
          name: string
          source?: string
          user_id?: string | null
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_property_invitation: {
        Args: { p_invitation_id: string }
        Returns: {
          created_at: string
          invited_by: string | null
          property_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "property_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_reservation: {
        Args: { p_reason?: string; p_reservation_id: string }
        Returns: {
          booking_fee_paise: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          created_at: string
          currency: string
          customer_id: string
          discount_paise: number
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guests: number
          id: string
          nights: number | null
          offer_code: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          property_id: string
          reference: string
          room_type_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          subtotal_paise: number
          taxes_paise: number
          total_paise: number
          units: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_reservation: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_guest_email?: string
          p_guest_name: string
          p_guest_phone: string
          p_guests: number
          p_offer_code?: string
          p_room_type_id: string
          p_special_requests?: string
        }
        Returns: {
          booking_fee_paise: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          created_at: string
          currency: string
          customer_id: string
          discount_paise: number
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guests: number
          id: string
          nights: number | null
          offer_code: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          property_id: string
          reference: string
          room_type_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          subtotal_paise: number
          taxes_paise: number
          total_paise: number
          units: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_my_account: { Args: never; Returns: undefined }
      reservation_location: {
        Args: { p_reservation_id: string }
        Returns: {
          address_line: string
          arrival_instructions: string
          city: string
          contact_phone: string
          latitude: number
          longitude: number
          postal_code: string
          state: string
        }[]
      }
      room_availability: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_room_type_id: string
        }
        Returns: number
      }
      update_reservation_status: {
        Args: {
          p_reservation_id: string
          p_status: Database["public"]["Enums"]["reservation_status"]
        }
        Returns: {
          booking_fee_paise: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          created_at: string
          currency: string
          customer_id: string
          discount_paise: number
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guests: number
          id: string
          nights: number | null
          offer_code: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          property_id: string
          reference: string
          room_type_id: string
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          subtotal_paise: number
          taxes_paise: number
          total_paise: number
          units: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      member_role: "owner" | "manager" | "staff"
      offer_status: "draft" | "in_review" | "published" | "archived"
      payment_method: "pay_at_property" | "online"
      payment_status: "unpaid" | "paid" | "refunded" | "partially_refunded"
      property_status: "draft" | "in_review" | "published" | "suspended"
      reservation_status:
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
        | "no_show"
      review_status: "pending" | "published" | "hidden"
      stay_style: "cottage" | "homestay" | "villa" | "resort" | "hotel"
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
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      member_role: ["owner", "manager", "staff"],
      offer_status: ["draft", "in_review", "published", "archived"],
      payment_method: ["pay_at_property", "online"],
      payment_status: ["unpaid", "paid", "refunded", "partially_refunded"],
      property_status: ["draft", "in_review", "published", "suspended"],
      reservation_status: [
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
        "no_show",
      ],
      review_status: ["pending", "published", "hidden"],
      stay_style: ["cottage", "homestay", "villa", "resort", "hotel"],
    },
  },
} as const
