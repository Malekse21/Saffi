import { createClient } from '@/utils/supabase/client';
import { OfflineQueue } from '@/lib/offline-sync';
import { toast } from 'sonner';

export interface Patient {
    id: string;
    user_id: string;
    ticket_number: string;
    name: string;
    status: 'waiting' | 'active' | 'completed' | 'away' | 'scheduled';
    type: 'walk-in' | 'rdv';
    arrival_time: string;
    rdv_time?: string;
    phone?: string;
    position: number;
    created_at: string;
    updated_at: string;
    motif?: string;
    is_priority?: boolean;
    appointmentTime?: string;
    recall_sent?: boolean;
}

export interface QueueSettings {
    id: string;
    user_id: string;
    last_ticket_number: number;
    created_at: string;
    updated_at: string;
}

// Helper to check connectivity
const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;

/**
 * Get the next ticket number for the current user
 */
export async function getNextTicketNumber(): Promise<string> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // If offline, we can't reliably predict the next ticket without risk.
    // However, if we are in "Offline Mode", the user might accept a temp ticket.
    // Let's assume the user has a locally cached state or we fetch from DB.
    // If offline, we throw or handle in addPatient. 
    // Here we just try to fetch.
    if (isOffline()) {
        return "Offline"; // Special marker or estimate? Let's handle in addPatient.
    }

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
    
    // If offline, we should try to return cached data if available + queued items?
    // But this function is typically SWR or real-time.
    // The UI (dashboard) might handle the caching or optimistic updates.
    // For now, if offline, this would fail.
    // We let it fail here, and let the UI/Hook handle fallback if desired, 
    // BUT we should merge the offline queue items if possible?
    // It's safer to let the UI hook handle "useNetworkStatus" + "OfflineQueue".
    // Or we update this to return mixed data.
    // For now, standard fetch.

    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        if (isOffline()) return []; // or handle better
        throw error;
    }
    return data || [];
}

/**
 * Get the next position for a new patient
 */
async function getNextPosition(userId: string): Promise<number> {
    if (isOffline()) return 999; // Arbitrary high number for offline
    
    const supabase = createClient();

    const { data, error } = await supabase
        .from('patients')
        .select('position')
        .eq('user_id', userId)
        .eq('status', 'waiting')
        .order('position', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error getting next position:', error);
        return 0;
    }

    return (data?.position || 0) + 1;
}

/**
 * Add a new patient to the queue
 */
export async function addPatient(
    name: string,
    phone?: string,
    type: 'walk-in' | 'rdv' = 'walk-in',
    rdvTime?: string,
    motif: string = 'consultation',
    isPriority: boolean = false
): Promise<Patient> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // OFFLINE HANDLING
    if (isOffline()) {
        const tempId = `temp_${crypto.randomUUID()}`;
        const tempTicket = "OFF";
        const tempPosition = 999;
        
        const optimisticPatient: Patient = {
            id: tempId,
            user_id: user.id,
            ticket_number: tempTicket,
            name,
            status: 'waiting',
            type,
            phone: phone || undefined,
            position: tempPosition,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            motif,
            is_priority: isPriority,
            arrival_time: new Date().toISOString(),
            rdv_time: rdvTime
        };

        OfflineQueue.addToQueue({
            type: 'ADD_PATIENT',
            payload: optimisticPatient
        });

        return optimisticPatient;
    }
    // END OFFLINE HANDLING

    const ticketNumber = await getNextTicketNumber();
    const position = await getNextPosition(user.id);

    const patientData: any = {
        user_id: user.id,
        ticket_number: ticketNumber,
        name,
        status: 'waiting',
        type,
        phone: phone || null,
        position,
        motif,
        is_priority: isPriority
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
    rdvTime?: string,
    motif: string = 'consultation'
): Promise<Patient> {
    if (isOffline()) {
        throw new Error("Impossible de rejoindre la file d'attente hors ligne.");
    }
    
    // ... (Keep existing logic for public add, usually requires internet anyway)
    const supabase = createClient();

    console.log('Step 1: Looking up clinic with ID:', clinicId);

    // First, try to find by slug, then by clinic_id
    let profile = null;
    let profileError = null;

    // Try slug first (for new system with human-readable URLs)
    const { data: slugProfile, error: slugError } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', clinicId)
        .maybeSingle();

    if (slugProfile) {
        profile = slugProfile;
    } else {
        // Fallback to clinic_id (UUID) for backward compatibility
        const { data: uuidProfile, error: uuidError } = await supabase
            .from('profiles')
            .select('id')
            .eq('clinic_id', clinicId)
            .maybeSingle();

        profile = uuidProfile;
        profileError = uuidError;
    }

    console.log('Step 2: Profile lookup result:', { profile, profileError });

    if (profileError) {
        console.error('Profile lookup error:', profileError);
        throw new Error(`Erreur de recherche: ${profileError.message}`);
    }

    if (!profile) {
        console.error('No profile found with slug or clinic_id:', clinicId);
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
    const position = await getNextPosition(userId);

    const patientData: any = {
        user_id: userId,
        ticket_number: ticketNumber,
        name,
        status: 'waiting',
        type,
        phone: phone || null,
        position,
        motif
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
    
    if (isOffline()) {
        OfflineQueue.addToQueue({
            type: 'UPDATE_STATUS',
            payload: { id: patientId, status }
        });
        
        // Return optimistic partial
        return {
           id: patientId,
           status: status,
           // other fields are not available here without fetching, but usually caller updates state
        } as Patient; 
    }

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
 * Update patient details
 */
export async function updatePatient(
    patientId: string,
    updates: Partial<Patient>
): Promise<Patient> {
    if (isOffline()) {
        OfflineQueue.addToQueue({
            type: 'UPDATE_PATIENT',
            payload: { id: patientId, ...updates }
        });
        
        return {
           id: patientId,
           ...updates,
        } as Patient;
    }

    const supabase = createClient();

    const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', patientId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Reorder patients in the queue
 */
export async function reorderPatients(patientIds: string[]): Promise<void> {
    if (isOffline()) {
        toast.error("La réinitialisation de l'ordre n'est pas disponible hors ligne.");
        return;
    }

    const supabase = createClient();

    // We update each patient's position based on their index in the array
    // We use a loop for now as Supabase JS client doesn't support bulk update easily
    for (let i = 0; i < patientIds.length; i++) {
        const id = patientIds[i];
        await supabase
            .from('patients')
            .update({ position: i + 1 })
            .eq('id', id);
    }
}

/**
 * Delete a patient
 */
export async function deletePatient(patientId: string): Promise<void> {
    if (isOffline()) {
        OfflineQueue.addToQueue({
            type: 'DELETE_PATIENT',
            payload: { id: patientId }
        });
        return;
    }

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
    callback: (payload: any) => void,
    onStatusChange?: (status: string) => void
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
        .subscribe((status) => {
            console.log('Realtime subscription status:', status);
            
            // Check for recovery
            if (status === 'SUBSCRIBED') {
               // We might trigger a queue sync here?
               // Ideally, we want to call OfflineQueue.processQueue() when connection restores.
               // We already have useNetworkStatus doing that? No, useNetworkStatus just updates state.
               // We need to trigger it.
               // Since real-time subscription status changes when we reconnect, this is a good place.
               OfflineQueue.processQueue();
            }

            if (onStatusChange) {
                onStatusChange(status);
            }
        });

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}
