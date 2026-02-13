export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Enum types matching the database
export type UserRole = 'landlord' | 'tenant' | 'guard' | 'superadmin'
export type PassStatus = 'active' | 'used' | 'expired' | 'revoked'
export type LeaseStatus = 'draft' | 'pending_signature' | 'active' | 'terminated' | 'expired'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    role: UserRole
                    full_name: string | null
                    phone_number: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    role?: UserRole
                    full_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    role?: UserRole
                    full_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            properties: {
                Row: {
                    id: string
                    landlord_id: string
                    name: string
                    address: string | null
                    total_units: number
                    latitude: number | null
                    longitude: number | null
                    geofence_radius: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    name: string
                    address?: string | null
                    total_units?: number
                    latitude?: number | null
                    longitude?: number | null
                    geofence_radius?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    name?: string
                    address?: string | null
                    total_units?: number
                    latitude?: number | null
                    longitude?: number | null
                    geofence_radius?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            units: {
                Row: {
                    id: string
                    property_id: string
                    unit_number: string
                    rent_amount: number
                    rent_due_day: number
                    status: string
                    current_tenant_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    unit_number: string
                    rent_amount?: number
                    rent_due_day?: number
                    status?: string
                    current_tenant_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    unit_number?: string
                    rent_amount?: number
                    rent_due_day?: number
                    status?: string
                    current_tenant_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            property_guards: {
                Row: {
                    id: string
                    property_id: string
                    guard_id: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    guard_id: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    guard_id?: string
                    is_active?: boolean
                    created_at?: string
                }
            }
            guard_assignments: {
                Row: {
                    id: string
                    property_id: string
                    guard_id: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    guard_id: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    guard_id?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            maintenance_requests: {
                Row: {
                    id: string
                    unit_id: string
                    tenant_id: string | null
                    category: string
                    priority: string
                    description: string
                    status: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    tenant_id?: string | null
                    category?: string
                    priority?: string
                    description: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    tenant_id?: string | null
                    category?: string
                    priority?: string
                    description?: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            banned_visitors: {
                Row: {
                    id: string
                    property_id: string
                    visitor_name: string
                    id_number: string | null
                    reason: string | null
                    banned_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    visitor_name: string
                    id_number?: string | null
                    reason?: string | null
                    banned_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    visitor_name?: string
                    id_number?: string | null
                    reason?: string | null
                    banned_by?: string | null
                    created_at?: string
                }
            }
            gate_passes: {
                Row: {
                    id: string
                    unit_id: string
                    property_id: string | null
                    tenant_id: string
                    visitor_name: string
                    visitor_phone: string | null
                    visitor_id_number: string | null
                    visitor_vehicle: string | null
                    purpose: string | null
                    access_code: string
                    qr_data: string | null
                    status: PassStatus
                    valid_until: string
                    checked_in_at: string | null
                    checked_out_at: string | null
                    checked_in_by: string | null
                    checked_out_by: string | null
                    entry_location: Json | null
                    exit_location: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    property_id?: string | null
                    tenant_id: string
                    visitor_name: string
                    visitor_phone?: string | null
                    visitor_id_number?: string | null
                    visitor_vehicle?: string | null
                    purpose?: string | null
                    access_code: string
                    qr_data?: string | null
                    status?: PassStatus
                    valid_until: string
                    checked_in_at?: string | null
                    checked_out_at?: string | null
                    checked_in_by?: string | null
                    checked_out_by?: string | null
                    entry_location?: Json | null
                    exit_location?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    property_id?: string | null
                    tenant_id?: string
                    visitor_name?: string
                    visitor_phone?: string | null
                    visitor_id_number?: string | null
                    visitor_vehicle?: string | null
                    purpose?: string | null
                    access_code?: string
                    qr_data?: string | null
                    status?: PassStatus
                    valid_until?: string
                    checked_in_at?: string | null
                    checked_out_at?: string | null
                    checked_in_by?: string | null
                    checked_out_by?: string | null
                    entry_location?: Json | null
                    exit_location?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            payment_settings: {
                Row: {
                    id: string
                    property_id: string
                    mpesa_enabled: boolean
                    mpesa_environment: string
                    mpesa_consumer_key: string | null
                    mpesa_consumer_secret: string | null
                    mpesa_passkey: string | null
                    mpesa_shortcode: string | null
                    mpesa_shortcode_type: string
                    callback_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    mpesa_enabled?: boolean
                    mpesa_environment?: string
                    mpesa_consumer_key?: string | null
                    mpesa_consumer_secret?: string | null
                    mpesa_passkey?: string | null
                    mpesa_shortcode?: string | null
                    mpesa_shortcode_type?: string
                    callback_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    mpesa_enabled?: boolean
                    mpesa_environment?: string
                    mpesa_consumer_key?: string | null
                    mpesa_consumer_secret?: string | null
                    mpesa_passkey?: string | null
                    mpesa_shortcode?: string | null
                    mpesa_shortcode_type?: string
                    callback_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            payment_transactions: {
                Row: {
                    id: string
                    property_id: string | null
                    unit_id: string | null
                    tenant_id: string | null
                    amount: number
                    phone_number: string
                    payment_type: string
                    payment_period: string | null
                    description: string | null
                    merchant_request_id: string | null
                    checkout_request_id: string | null
                    mpesa_receipt_number: string | null
                    transaction_date: string | null
                    status: PaymentStatus
                    result_code: string | null
                    result_description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id?: string | null
                    unit_id?: string | null
                    tenant_id?: string | null
                    amount: number
                    phone_number: string
                    payment_type?: string
                    payment_period?: string | null
                    description?: string | null
                    merchant_request_id?: string | null
                    checkout_request_id?: string | null
                    mpesa_receipt_number?: string | null
                    transaction_date?: string | null
                    status?: PaymentStatus
                    result_code?: string | null
                    result_description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string | null
                    unit_id?: string | null
                    tenant_id?: string | null
                    amount?: number
                    phone_number?: string
                    payment_type?: string
                    payment_period?: string | null
                    description?: string | null
                    merchant_request_id?: string | null
                    checkout_request_id?: string | null
                    mpesa_receipt_number?: string | null
                    transaction_date?: string | null
                    status?: PaymentStatus
                    result_code?: string | null
                    result_description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            invitations: {
                Row: {
                    id: string
                    email: string
                    role: 'tenant' | 'guard'
                    property_id: string
                    unit_id: string | null
                    invited_by: string
                    token: string
                    status: InvitationStatus
                    expires_at: string
                    accepted_at: string | null
                    full_name: string | null
                    phone_number: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    role: 'tenant' | 'guard'
                    property_id: string
                    unit_id?: string | null
                    invited_by: string
                    token: string
                    status?: InvitationStatus
                    expires_at?: string
                    accepted_at?: string | null
                    full_name?: string | null
                    phone_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'tenant' | 'guard'
                    property_id?: string
                    unit_id?: string | null
                    invited_by?: string
                    token?: string
                    status?: InvitationStatus
                    expires_at?: string
                    accepted_at?: string | null
                    full_name?: string | null
                    phone_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            leases: {
                Row: {
                    id: string
                    unit_id: string
                    tenant_id: string
                    start_date: string
                    end_date: string
                    rent_amount: number
                    security_deposit: number
                    status: LeaseStatus
                    terms_text: string | null
                    pdf_url: string | null
                    signed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    tenant_id: string
                    start_date: string
                    end_date: string
                    rent_amount: number
                    security_deposit?: number
                    status?: LeaseStatus
                    terms_text?: string | null
                    pdf_url?: string | null
                    signed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    tenant_id?: string
                    start_date?: string
                    end_date?: string
                    rent_amount?: number
                    security_deposit?: number
                    status?: LeaseStatus
                    terms_text?: string | null
                    pdf_url?: string | null
                    signed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            subscription_plans: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    price_monthly: number
                    max_properties: number
                    max_units_per_property: number
                    max_guards: number
                    features: Json
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    price_monthly?: number
                    max_properties?: number
                    max_units_per_property?: number
                    max_guards?: number
                    features?: Json
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    price_monthly?: number
                    max_properties?: number
                    max_units_per_property?: number
                    max_guards?: number
                    features?: Json
                    is_active?: boolean
                    created_at?: string
                }
            }
            subscriptions: {
                Row: {
                    id: string
                    landlord_id: string
                    plan_id: string
                    status: SubscriptionStatus
                    current_period_start: string
                    current_period_end: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    plan_id: string
                    status?: SubscriptionStatus
                    current_period_start?: string
                    current_period_end?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    plan_id?: string
                    status?: SubscriptionStatus
                    current_period_start?: string
                    current_period_end?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: UserRole
            pass_status: PassStatus
            lease_status: LeaseStatus
        }
    }
}

// ─── Convenience aliases ───────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update']

// Common row type shortcuts
export type Profile = Tables<'profiles'>
export type Property = Tables<'properties'>
export type Unit = Tables<'units'>
export type GatePass = Tables<'gate_passes'>
export type PaymentTransaction = Tables<'payment_transactions'>
export type PaymentSettings = Tables<'payment_settings'>
export type Invitation = Tables<'invitations'>
export type Lease = Tables<'leases'>
export type SubscriptionPlan = Tables<'subscription_plans'>
export type Subscription = Tables<'subscriptions'>
