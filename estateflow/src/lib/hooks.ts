'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

// Hook to fetch and manage properties
export function useProperties() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchProperties = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setProperties(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const createProperty = async (data: {
        name: string;
        address: string;
        total_units: number;
    }) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const { data: property, error } = await supabase
            .from('properties')
            .insert({
                landlord_id: user.id,
                name: data.name,
                address: data.address,
                total_units: data.total_units,
            })
            .select()
            .single();

        if (error) throw error;

        await fetchProperties();
        return property;
    };

    const deleteProperty = async (id: string) => {
        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (error) throw error;
        await fetchProperties();
    };

    const updateProperty = async (id: string, data: {
        name: string;
        address: string;
        total_units: number;
    }) => {
        const { error } = await supabase
            .from('properties')
            .update({
                name: data.name,
                address: data.address,
                total_units: data.total_units,
            })
            .eq('id', id);

        if (error) throw error;
        await fetchProperties();
    };

    return { properties, loading, error, createProperty, updateProperty, deleteProperty, refetch: fetchProperties };
}

// Hook to fetch units for a property
export function useUnits(propertyId: string) {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchUnits = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('units')
            .select(`
        *,
        current_tenant:profiles(id, full_name, phone_number)
      `)
            .eq('property_id', propertyId)
            .order('unit_number');

        if (error) {
            setError(error.message);
        } else {
            setUnits(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (propertyId) fetchUnits();
    }, [propertyId]);

    const createUnit = async (data: {
        unit_number: string;
        rent_amount: number;
        rent_due_day: number;
    }) => {
        const { error } = await supabase.from('units').insert({
            property_id: propertyId,
            unit_number: data.unit_number,
            rent_amount: data.rent_amount,
            rent_due_day: data.rent_due_day,
        });

        if (error) throw error;
        await fetchUnits();
    };

    return { units, loading, error, createUnit, refetch: fetchUnits };
}

// Hook to get current user profile
export function useProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                setProfile(data);
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    return { profile, loading };
}
