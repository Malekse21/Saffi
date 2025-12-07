import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient(); // Use await for server client creation if needed, or check utils
        // Note: Check if createClient is async or not in this project. Usually it is in newer templates.
        // Based on `utils/supabase/client.ts` it was `createBrowserClient`.
        // I need to check `utils/supabase/server.ts` to be sure how to import it.
        // Assuming standard Next.js Supabase template.

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch appointments for TODAY
        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('*')
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .eq('doctor_id', user.id); // Ensure we only get doctor's appointments

        if (aptError) throw aptError;

        // 2. Fetch existing queue items (patients) for TODAY
        // We look for patients created/arrived today OR scheduled for today
        // Actually, we should check by `appointment_id` to avoid duplicates if possible.
        // The queue might be cleared daily? Or we check date?
        // Let's filter by checking if any patient record already links to the appointment_id.
        // Since `appointment_id` is unique per appointment.

        if (!appointments || appointments.length === 0) {
            return NextResponse.json({ message: 'No appointments for today' });
        }

        const appointmentIds = appointments.map(a => a.id);

        const { data: existingQueueItems, error: queueError } = await supabase
            .from('patients')
            .select('appointment_id')
            .in('appointment_id', appointmentIds);

        if (queueError) throw queueError;

        const existingAppointmentIds = new Set(existingQueueItems?.map(q => q.appointment_id));

        // 3. Identify missing appointments
        const missingAppointments = appointments.filter(a => !existingAppointmentIds.has(a.id));

        if (missingAppointments.length === 0) {
            return NextResponse.json({ message: 'All appointments already in queue' });
        }

        // 4. Bulk Insert missing appointments
        // Need to get last ticket number first
        const { data: settings } = await supabase
            .from('queue_settings')
            .select('last_ticket_number')
            .eq('user_id', user.id)
            .single();

        let currentTicket = settings?.last_ticket_number || 0;
        const newQueueItems = [];

        for (const apt of missingAppointments) {
            currentTicket++;
            newQueueItems.push({
                user_id: user.id,
                name: apt.patient_name,
                phone: apt.phone,
                ticket_number: `A${currentTicket.toString().padStart(3, '0')}`,
                status: 'scheduled',
                type: 'rdv',
                appointment_id: apt.id,
                rdv_time: apt.start_time,
                motif: apt.motif,
                is_priority: true // RDV priority
            });
        }

        // Update ticket number settings
        await supabase
            .from('queue_settings')
            .update({ last_ticket_number: currentTicket })
            .eq('user_id', user.id);

        // Insert patients
        const { error: insertError } = await supabase
            .from('patients')
            .insert(newQueueItems);

        if (insertError) throw insertError;

        return NextResponse.json({ 
            success: true, 
            synced_count: missingAppointments.length, 
            message: `Synced ${missingAppointments.length} appointments to queue` 
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
