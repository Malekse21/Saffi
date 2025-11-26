import { createClient } from '@/utils/supabase/client';

export interface Patient {
    id: string;
    user_id: string;
    ticket_number: string;
    name: string;
    status: 'waiting' | 'active' | 'completed' | 'away';
    type: 'walk-in' | 'rdv';
    arrival_time: string;
    rdv_time?: string;
    phone?: string;
    created_at: string;
    updated_at: string;
}

export interface QueueSettings {
    id: string;
    user_id: string;
    last_ticket_number: number;
    created_at: string;
    updated_at: string;
}

/**
 * Get the next ticket number for the current user
 */
export async function getNextTicketNumber(): Promise<string> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Get or create queue settings
    let { data: settings } = await supabase
        .from('queue_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!settings) {
        // Create initial settings
        const { data: newSettings, error } = await supabase
            .from('queue_settings')
            .insert({ user_id: user.id, last_ticket_number: 0 })
            .select()
            .single();

        if (error) throw error;
        settings = newSettings;
    }

    // Increment ticket number
    const nextNumber = (settings.last_ticket_number || 0) + 1;

    // Update settings
    await supabase
        .from('queue_settings')
        .update({ last_ticket_number: nextNumber })
        .eq('user_id', user.id);

    return nextNumber.toString();
}

/**
 * Get all patients for the current user
 */
export async function getPatients(): Promise<Patient[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Add a new patient to the queue
 */
export async function addPatient(
    name: string,
    phone?: string,
    type: 'walk-in' | 'rdv' = 'walk-in',
    rdvTime?: string
): Promise<Patient> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const ticketNumber = await getNextTicketNumber();

    const patientData: any = {
        user_id: user.id,
        ticket_number: ticketNumber,
        name,
        status: 'waiting',
        type,
        phone: phone || null,
    };

    if (rdvTime) {
        patientData.rdv_time = rdvTime;
    }

    const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Add a new patient to the queue by clinic ID (for unauthenticated patients)
 */
export async function addPatientByClinicId(
    clinicId: string,
    name: string,
    phone?: string,
    type: 'walk-in' | 'rdv' = 'walk-in',
    rdvTime?: string
): Promise<Patient> {
    const supabase = createClient();

    console.log('Step 1: Looking up clinic with ID:', clinicId);

    // First, get the user_id from the profiles table using clinic_id
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clinic_id', clinicId)
        .maybeSingle();

    console.log('Step 2: Profile lookup result:', { profile, profileError });

    if (profileError) {
        console.error('Profile lookup error:', profileError);
        throw new Error(`Erreur de recherche: ${profileError.message}`);
    }

    if (!profile) {
        console.error('No profile found with clinic_id:', clinicId);
        throw new Error('Cabinet introuvable. Veuillez vérifier le QR code ou contactez le cabinet.');
    }

    const userId = profile.id;
    console.log('Step 3: Found user ID:', userId);

    // Get the next ticket number for this user
    console.log('Step 4: Getting queue settings for user:', userId);
    let { data: settings } = await supabase
        .from('queue_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    console.log('Step 5: Queue settings:', settings);

    if (!settings) {
        console.log('Step 6: Creating initial queue settings');
        // Create initial settings
        const { data: newSettings, error } = await supabase
            .from('queue_settings')
            .insert({ user_id: userId, last_ticket_number: 0 })
            .select()
            .single();

        if (error) {
            console.error('Error creating queue settings:', error);
            throw error;
        }
        settings = newSettings;
    }

    // Increment ticket number
    const nextNumber = (settings.last_ticket_number || 0) + 1;
    console.log('Step 7: Next ticket number:', nextNumber);

    // Update settings
    console.log('Step 8: Updating queue settings');
    await supabase
        .from('queue_settings')
        .update({ last_ticket_number: nextNumber })
        .eq('user_id', userId);

    const ticketNumber = nextNumber.toString();

    const patientData: any = {
        user_id: userId,
        ticket_number: ticketNumber,
        name,
        status: 'waiting',
        type,
        phone: phone || null,
    };

    if (rdvTime) {
        patientData.rdv_time = rdvTime;
    }

    console.log('Step 9: Inserting patient:', patientData);

    const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

    console.log('Step 10: Insert result:', { data, error });

    if (error) {
        console.error('Patient insert error:', error);
        throw error;
    }

    return data;
}

/**
 * Update patient status
 */
export async function updatePatientStatus(
    patientId: string,
    status: 'waiting' | 'active' | 'completed' | 'away'
): Promise<Patient> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('patients')
        .update({ status })
        .eq('id', patientId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a patient
 */
export async function deletePatient(patientId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

    if (error) throw error;
}

/**
 * Get active patient (if any)
 */
export async function getActivePatient(): Promise<Patient | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
}

/**
 * Subscribe to real-time patient updates
 */
export function subscribeToPatients(
    callback: (payload: any) => void
): () => void {
    const supabase = createClient();

    const channel = supabase
        .channel('patients_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'patients',
            },
            callback
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}
