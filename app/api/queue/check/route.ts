import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { phone, doctorId } = await request.json();

        if (!phone || !doctorId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createClient();
        const cleanPhone = phone.replace(/\s/g, '').replace('+216', '');

        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: scheduledPatient } = await supabase
            .from('patients')
            .select('name, rdv_time')
            .eq('user_id', doctorId)
            .eq('phone', cleanPhone)
            .eq('status', 'scheduled')
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString())
            .single();

        if (scheduledPatient) {
            return NextResponse.json({ 
                found: true, 
                patient: scheduledPatient 
            });
        }

        return NextResponse.json({ found: false });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
