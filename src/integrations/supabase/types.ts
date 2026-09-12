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
      contractor_applications: {
        Row: {
          availability: string[]
          certification_notes: string | null
          certifications: string[]
          city: string | null
          company_name: string
          contact_name: string
          contractor_id: string | null
          created_at: string
          document_paths: string[]
          email: string
          emergency_available: boolean
          iban: string | null
          id: string
          insurer: string | null
          invite_id: string | null
          invoice_email: string | null
          kvk_number: string
          notes: string | null
          phone: string
          policy_number: string | null
          postal_code: string | null
          service_areas: string[]
          specialties: string[]
          status: string
          street: string | null
          telegram_user_id: number | null
          telegram_username: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          travel_radius_km: number
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          availability?: string[]
          certification_notes?: string | null
          certifications?: string[]
          city?: string | null
          company_name: string
          contact_name: string
          contractor_id?: string | null
          created_at?: string
          document_paths?: string[]
          email: string
          emergency_available?: boolean
          iban?: string | null
          id?: string
          insurer?: string | null
          invite_id?: string | null
          invoice_email?: string | null
          kvk_number: string
          notes?: string | null
          phone: string
          policy_number?: string | null
          postal_code?: string | null
          service_areas?: string[]
          specialties?: string[]
          status?: string
          street?: string | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          travel_radius_km?: number
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          availability?: string[]
          certification_notes?: string | null
          certifications?: string[]
          city?: string | null
          company_name?: string
          contact_name?: string
          contractor_id?: string | null
          created_at?: string
          document_paths?: string[]
          email?: string
          emergency_available?: boolean
          iban?: string | null
          id?: string
          insurer?: string | null
          invite_id?: string | null
          invoice_email?: string | null
          kvk_number?: string
          notes?: string | null
          phone?: string
          policy_number?: string | null
          postal_code?: string | null
          service_areas?: string[]
          specialties?: string[]
          status?: string
          street?: string | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          travel_radius_km?: number
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_applications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_applications_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "contractor_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_invites: {
        Row: {
          application_id: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          note: string | null
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          note?: string | null
          token: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          note?: string | null
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_invites_application_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_transactions: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          contractor_id: string
          created_at: string
          id: string
          kind: string
          lead_id: string | null
          note: string | null
        }
        Insert: {
          amount_cents: number
          balance_after_cents: number
          contractor_id: string
          created_at?: string
          id?: string
          kind: string
          lead_id?: string | null
          note?: string | null
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          contractor_id?: string
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_transactions_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          balance_cents: number
          company: string | null
          created_at: string
          email: string | null
          iban: string | null
          id: string
          invoice_email: string | null
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          telegram_user_id: number | null
          updated_at: string
        }
        Insert: {
          balance_cents?: number
          company?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          invoice_email?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          telegram_user_id?: number | null
          updated_at?: string
        }
        Update: {
          balance_cents?: number
          company?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          invoice_email?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          telegram_user_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          bot_reason: string | null
          conversion_type: string
          created_at: string
          cta_location: string
          device: string
          event_name: string
          id: string
          is_bot: boolean
          language: string
          page_path: string
          referrer_host: string | null
          source: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          bot_reason?: string | null
          conversion_type: string
          created_at?: string
          cta_location?: string
          device?: string
          event_name: string
          id?: string
          is_bot?: boolean
          language?: string
          page_path: string
          referrer_host?: string | null
          source?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          bot_reason?: string | null
          conversion_type?: string
          created_at?: string
          cta_location?: string
          device?: string
          event_name?: string
          id?: string
          is_bot?: boolean
          language?: string
          page_path?: string
          referrer_host?: string | null
          source?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      lead_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_audit_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_deliveries: {
        Row: {
          attempts: number
          contractor_id: string
          created_at: string
          last_error: string | null
          lead_id: string
          lease_until: string | null
          next_attempt_at: string
          sent_at: string | null
          status: string
          telegram_user_id: number | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          contractor_id: string
          created_at?: string
          last_error?: string | null
          lead_id: string
          lease_until?: string | null
          next_attempt_at?: string
          sent_at?: string | null
          status?: string
          telegram_user_id?: number | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          contractor_id?: string
          created_at?: string
          last_error?: string | null
          lead_id?: string
          lease_until?: string | null
          next_attempt_at?: string
          sent_at?: string | null
          status?: string
          telegram_user_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_deliveries_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_deliveries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notification_outbox: {
        Row: {
          channel: string
          created_at: string
          id: string
          last_error: string | null
          lead_id: string
          payload: Json
          retry_count: number
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          last_error?: string | null
          lead_id: string
          payload?: Json
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          last_error?: string | null
          lead_id?: string
          payload?: Json
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notification_outbox_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_reminder_config: {
        Row: {
          created_at: string
          id: number
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: number
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_reminders: {
        Row: {
          attempts: number
          created_at: string
          dispatched_at: string
          lead_id: string
          lease_until: string
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dispatched_at: string
          lead_id: string
          lease_until: string
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dispatched_at?: string
          lead_id?: string
          lease_until?: string
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_settings: {
        Row: {
          created_at: string
          default_price_cents: number
          id: number
          updated_at: string
          urgent_price_cents: number
        }
        Insert: {
          created_at?: string
          default_price_cents?: number
          id?: number
          updated_at?: string
          urgent_price_cents?: number
        }
        Update: {
          created_at?: string
          default_price_cents?: number
          id?: number
          updated_at?: string
          urgent_price_cents?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          agreed_price_details: string | null
          city: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          description: string | null
          dispatched_at: string | null
          duplicate_of_id: string | null
          external_ref: string | null
          id: string
          idempotency_key: string | null
          image_urls: string[]
          intake_session_id: string | null
          intent: string | null
          is_urgent: boolean
          job_type: string
          postal_code: string | null
          price_cents: number
          price_status: string
          pricing_note: string | null
          pricing_type: Database["public"]["Enums"]["enum_pricing_type"]
          service: string | null
          source: string
          source_page: string | null
          source_path: string | null
          status: string
          telegram_message_id: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          agreed_price_details?: string | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          description?: string | null
          dispatched_at?: string | null
          duplicate_of_id?: string | null
          external_ref?: string | null
          id?: string
          idempotency_key?: string | null
          image_urls?: string[]
          intake_session_id?: string | null
          intent?: string | null
          is_urgent?: boolean
          job_type: string
          postal_code?: string | null
          price_cents?: number
          price_status?: string
          pricing_note?: string | null
          pricing_type?: Database["public"]["Enums"]["enum_pricing_type"]
          service?: string | null
          source?: string
          source_page?: string | null
          source_path?: string | null
          status?: string
          telegram_message_id?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          agreed_price_details?: string | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          description?: string | null
          dispatched_at?: string | null
          duplicate_of_id?: string | null
          external_ref?: string | null
          id?: string
          idempotency_key?: string | null
          image_urls?: string[]
          intake_session_id?: string | null
          intent?: string | null
          is_urgent?: boolean
          job_type?: string
          postal_code?: string | null
          price_cents?: number
          price_status?: string
          pricing_note?: string | null
          pricing_type?: Database["public"]["Enums"]["enum_pricing_type"]
          service?: string | null
          source?: string
          source_page?: string | null
          source_path?: string | null
          status?: string
          telegram_message_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          attempts: number
          created_at: string
          id: string
          kind: string
          last_error: string | null
          lease_until: string | null
          next_attempt_at: string
          payload: Json
          quote_request_id: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          lease_until?: string | null
          next_attempt_at?: string
          payload?: Json
          quote_request_id: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          lease_until?: string | null
          next_attempt_at?: string
          payload?: Json
          quote_request_id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          appointment_date: string | null
          appointment_note: string | null
          appointment_slot: string | null
          attachment_paths: string[]
          booking_intent: string | null
          booking_route: string | null
          booking_service: string | null
          catalog_version: string | null
          city: string | null
          created_at: string
          email: string | null
          house_number: string | null
          id: string
          idempotency_key: string | null
          ip_hash: string | null
          job_type: string
          locale: string
          message: string | null
          name: string
          notification_status: string
          phone: string
          postal_area: string | null
          postal_code: string | null
          price_snapshot: Json | null
          price_status: string | null
          price_total_cents: number | null
          request_hash: string | null
          source_path: string | null
          status: string
          street: string | null
          user_agent: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_note?: string | null
          appointment_slot?: string | null
          attachment_paths?: string[]
          booking_intent?: string | null
          booking_route?: string | null
          booking_service?: string | null
          catalog_version?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          house_number?: string | null
          id?: string
          idempotency_key?: string | null
          ip_hash?: string | null
          job_type: string
          locale?: string
          message?: string | null
          name: string
          notification_status?: string
          phone: string
          postal_area?: string | null
          postal_code?: string | null
          price_snapshot?: Json | null
          price_status?: string | null
          price_total_cents?: number | null
          request_hash?: string | null
          source_path?: string | null
          status?: string
          street?: string | null
          user_agent?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_note?: string | null
          appointment_slot?: string | null
          attachment_paths?: string[]
          booking_intent?: string | null
          booking_route?: string | null
          booking_service?: string | null
          catalog_version?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          house_number?: string | null
          id?: string
          idempotency_key?: string | null
          ip_hash?: string | null
          job_type?: string
          locale?: string
          message?: string | null
          name?: string
          notification_status?: string
          phone?: string
          postal_area?: string | null
          postal_code?: string | null
          price_snapshot?: Json | null
          price_status?: string | null
          price_total_cents?: number | null
          request_hash?: string | null
          source_path?: string | null
          status?: string
          street?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      rank_snapshots: {
        Row: {
          captured_at: string
          clicks: number
          ctr: number
          id: string
          impressions: number
          keyword: string
          position: number | null
          top_page: string | null
          week_start: string
        }
        Insert: {
          captured_at?: string
          clicks?: number
          ctr?: number
          id?: string
          impressions?: number
          keyword: string
          position?: number | null
          top_page?: string | null
          week_start: string
        }
        Update: {
          captured_at?: string
          clicks?: number
          ctr?: number
          id?: string
          impressions?: number
          keyword?: string
          position?: number | null
          top_page?: string | null
          week_start?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      adjust_contractor_balance: {
        Args: { _amount_cents: number; _contractor_id: string; _note: string }
        Returns: number
      }
      append_lead_photos: {
        Args: { _lead_id: string; _paths: string[] }
        Returns: {
          address: string | null
          agreed_price_details: string | null
          city: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          description: string | null
          dispatched_at: string | null
          duplicate_of_id: string | null
          external_ref: string | null
          id: string
          idempotency_key: string | null
          image_urls: string[]
          intake_session_id: string | null
          intent: string | null
          is_urgent: boolean
          job_type: string
          postal_code: string | null
          price_cents: number
          price_status: string
          pricing_note: string | null
          pricing_type: Database["public"]["Enums"]["enum_pricing_type"]
          service: string | null
          source: string
          source_page: string | null
          source_path: string | null
          status: string
          telegram_message_id: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_lead: {
        Args: { _lead_id: string; _telegram_user_id: number }
        Returns: Json
      }
      credit_contractor_topup: {
        Args: {
          _amount_cents: number
          _contractor_id: string
          _payment_ref: string
        }
        Returns: Json
      }
      enqueue_lead_reminder_check: { Args: never; Returns: number }
      enqueue_notification_retry: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      report_lead_spam: {
        Args: {
          _lead_id: string
          _reporter_name: string
          _telegram_user_id: number
        }
        Returns: Json
      }
      reserve_lead_deliveries: {
        Args: { _limit: number }
        Returns: {
          attempts: number
          contractor_id: string
          created_at: string
          last_error: string | null
          lead_id: string
          lease_until: string | null
          next_attempt_at: string
          sent_at: string | null
          status: string
          telegram_user_id: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "lead_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      reserve_notifications: {
        Args: { _limit: number; _quote_request_id?: string }
        Returns: {
          attempts: number
          created_at: string
          id: string
          kind: string
          last_error: string | null
          lease_until: string | null
          next_attempt_at: string
          payload: Json
          quote_request_id: string
          sent_at: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      reserve_overdue_lead_reminders: {
        Args: never
        Returns: {
          dispatched_at: string
          lead_id: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user"
      enum_lead_source:
        | "website"
        | "phone_manual"
        | "whatsapp_manual"
        | "referral"
      enum_lead_status:
        | "new"
        | "dispatched"
        | "claimed"
        | "cancelled"
        | "spam_review"
        | "blocked_spam"
      enum_pricing_type: "standard" | "hourly" | "fixed"
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
      app_role: ["admin", "user"],
      enum_lead_source: [
        "website",
        "phone_manual",
        "whatsapp_manual",
        "referral",
      ],
      enum_lead_status: [
        "new",
        "dispatched",
        "claimed",
        "cancelled",
        "spam_review",
        "blocked_spam",
      ],
      enum_pricing_type: ["standard", "hourly", "fixed"],
    },
  },
} as const
