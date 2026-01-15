export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'landlord' | 'tenant' | 'guard'
                    full_name: string | null
                    phone_number: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    role?: 'landlord' | 'tenant' | 'guard'
                    full_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    role?: 'landlord' | 'tenant' | 'guard'
                    full_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            // Add other tables here as needed or run type gen
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: 'landlord' | 'tenant' | 'guard'
        }
    }
}
