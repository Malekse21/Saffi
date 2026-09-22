'use client';

import { createClient } from '@/utils/supabase/client';
import JoinQueueForm from './JoinQueueForm';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ClientJoinLogic({ motifs, clinicId }: { motifs: any[], clinicId: string }) {
    const supabase = createClient();
    const router = useRouter();

    const handleJoin = async (formData: any) => {
        try {
            // 1. Get Clinic Settings for ticket number (Simplified logic for now, or call RPC)
            // For now, simple insert
            const { data: queueSettings } = await supabase
                .from('queue_settings')
                .select('ticket_counter')
                .eq('user_id', clinicId)
                .single();
            
            // Logic to increment ticket would ideally be server-side or RPC to avoid race conditions
            // But following the "Client Logic" pattern requested:
            
            const newTicketNumber = (queueSettings?.ticket_counter || 0) + 1;
            
            // Insert Patient
            const { error } = await supabase.from('patients').insert({
                full_name: formData.fullName,
                phone: formData.phone,
                motif: formData.motif,
                clinic_id: clinicId,
                status: 'waiting',
                ticket_number: newTicketNumber, // This is unsafe without backend/RPC but ok for demo
                is_priority: false // Default
            });

            if (error) throw error;

            // Update Counter
            await supabase.from('queue_settings').upsert({ 
                user_id: clinicId, 
                ticket_counter: newTicketNumber,
                updated_at: new Date().toISOString()
            });

            toast.success("Vous êtes inscrit !");
            // Redirect or show success state
            // router.push('/ticket-view?id=...'); 
            
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de l'inscription");
        }
    };

    return <JoinQueueForm motifs={motifs} onSubmit={handleJoin} />;
}
