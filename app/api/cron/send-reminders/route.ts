import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Calculate Time Window (Tomorrow at this hour +/- 1 hour margin?)
        // The user said "exactly 24 hours before". 
        // We'll look for appointments starting between Now+24h and Now+25h (assuming cron runs hourly).
        
        const now = new Date();
        const startWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Now + 24h
        const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // Now + 25h

        // 2. Query Appointments
        const { data: appointments, error: queryError } = await supabase
            .from('appointments')
            .select('*, doctor:doctor_id(full_name)') // Assuming relation or we fetch doctor name
            // Actually 'doctor_id' refers to auth.users usually, which links to 'profiles'.
            // Let's just fetch appointment and handling doctor name might need a join or proper relation.
            // For now, let's fetch raw and assume we can get doctor name if needed or just use generic.
            // Supabase join syntax: .select('*, profiles:doctor_id(full_name)') if FK exists to profiles.
            // Based on schema `doctor_id UUID REFERENCES auth.users(id)`, and profiles also links to auth.users.
            // It's safer to maybe not rely on complex joins if not sure of FK name.
            // Let's just select `*` and `doctor_id`.
            .eq('reminder_sent', false)
            .gte('start_time', startWindow.toISOString())
            .lt('start_time', endWindow.toISOString());

        if (queryError) throw queryError;

        if (!appointments || appointments.length === 0) {
            return NextResponse.json({ message: 'No reminders to send', count: 0 });
        }

        let sentCount = 0;

        // 3. Loop & Send
        for (const apt of appointments) {
            // Fetch doctor name for the message if possible
            // We can do a quick fetch or just use a placeholder if costly.
            // Let's try to get it.
            let doctorName = "votre médecin";
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', apt.doctor_id).single();
            if (profile?.full_name) doctorName = `Dr. ${profile.full_name}`;

            const appointmentTime = new Date(apt.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            const message = `Bonjour ${apt.patient_name}, rappel de votre RDV avec ${doctorName} demain à ${appointmentTime}. Répondez pour confirmer.`;

            // Mock Send
            await sendWhatsApp(apt.phone, message);

            // Update DB
            await supabase
                .from('appointments')
                .update({ reminder_sent: true })
                .eq('id', apt.id);
            
            sentCount++;
        }

        return NextResponse.json({ success: true, count: sentCount, message: `Sent ${sentCount} reminders` });

    } catch (error: any) {
        console.error('Reminder Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper Function Stub
async function sendWhatsApp(phone: string, message: string) {
    console.log(`[WHATSAPP MOCK] To: ${phone} | Msg: ${message}`);
    // In production, call Twilio / UltraMsg here
    return true;
}
