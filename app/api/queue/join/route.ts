import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { phone, name, doctorId } = await request.json();

        if (!phone || !doctorId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Normalize Phone (Remove spaces, +216)
        // Assuming strict 8 digit format for Tunisia or generic normalization
        const cleanPhone = phone.replace(/\s/g, '').replace('+216', '');

        // 2. Search for existing Scheduled appointment for TODAY
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // We search in the `patients` table (the queue) for a 'scheduled' item
        // matching the phone and user_id(doctorId)
        const { data: scheduledPatient, error: searchError } = await supabase
            .from('patients')
            .select('*')
            .eq('user_id', doctorId)
            .eq('phone', cleanPhone)
            .eq('status', 'scheduled')
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString())
            .single();

        if (scheduledPatient) {
            // ✅ MATCH FOUND: Convert to Waiting
            const { error: updateError } = await supabase
                .from('patients')
                .update({ 
                    status: 'waiting',
                    name: name || scheduledPatient.name, // Update name if provided, else keep original
                    arrival_time: new Date().toISOString()
                })
                .eq('id', scheduledPatient.id);

            if (updateError) throw updateError;

            return NextResponse.json({ 
                success: true, 
                type: 'rdv_confirmed', 
                patient: scheduledPatient 
            });

        } else {
            // ❌ NO MATCH: Create new Walk-in
            // Fetch last ticket number
            const { data: settings } = await supabase
                .from('queue_settings')
                .select('last_ticket_number')
                .eq('user_id', doctorId)
                .single();

            const nextTicket = (settings?.last_ticket_number || 0) + 1;

            // Update settings
            await supabase
                .from('queue_settings')
                .update({ last_ticket_number: nextTicket })
                .eq('user_id', doctorId);

            const ticketNumber = `W${nextTicket.toString().padStart(3, '0')}`; // W for Walk-in? Or just Number. User used A for RDV in previous step. Let's use simple increment.
            // Actually user logic just said increment. Let's use standard.
            // Previous code used `A...` for RDV. Maybe `T...` for Walk-in or just number.
            // Let's stick to the existing pattern if any, defaulting to just the number prefixed if standard.
            // Re-reading previous `AddAppointmentModal`: `A${nextTicket...}`.
            // Let's use `P${nextTicket...}` for present/patient or just keep it simple.
            // The user didn't specify prefix for walk-in in this prompt.
            // I'll use `W` for Walk-in to distinguish or just `T` (Ticket).
            // Let's use the formatted ticket number `A...` as consistent with RDV if they share the same counter?
            // Usually walk-ins and RDVs share the counter to show sequence.
            const formattedTicket = `${nextTicket.toString().padStart(3, '0')}`;

            const { data: newPatient, error: insertError } = await supabase
                .from('patients')
                .insert([
                    {
                        user_id: doctorId,
                        name: name || 'Patient Sans Nom',
                        phone: cleanPhone,
                        ticket_number: formattedTicket,
                        status: 'waiting',
                        type: 'walk-in',
                        arrival_time: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (insertError) throw insertError;

            return NextResponse.json({ 
                success: true, 
                type: 'walk_in',
                patient: newPatient
            });
        }

    } catch (error: any) {
        console.error('Join error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
