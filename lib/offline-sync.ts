import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export interface OfflineMutation {
    id: string;
    type: 'ADD_PATIENT' | 'UPDATE_STATUS' | 'UPDATE_PATIENT' | 'DELETE_PATIENT';
    payload: any;
    timestamp: number;
}

const QUEUE_KEY = 'saffi_offline_queue';

export class OfflineQueue {
    static getQueue(): OfflineMutation[] {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    static addToQueue(mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) {
        const queue = this.getQueue();
        const newMutation: OfflineMutation = {
            ...mutation,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };
        queue.push(newMutation);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        toast.info("Action sauvegardée hors ligne. Elle sera synchronisée une fois connecté.");
    }

    static clearQueue() {
        localStorage.removeItem(QUEUE_KEY);
    }

    static async processQueue() {
        const queue = this.getQueue();
        if (queue.length === 0) return;

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Cannot sync if not auth

        toast.loading("Synchronisation des données...", { id: "sync-process" });

        let successCount = 0;
        let errorCount = 0;
        const idMap = new Map<string, string>(); // Maps temp_id -> real_id
        
        // Process sequentially to maintain order
        for (const mutation of queue) {
            try {
                // Resolve IDs in payload if they match a known temp ID
                if (mutation.payload.id && idMap.has(mutation.payload.id)) {
                    mutation.payload.id = idMap.get(mutation.payload.id);
                }

                switch (mutation.type) {
                    case 'ADD_PATIENT':
                        // Remove temp ID from payload for insertion
                        // We extract ticket_number to avoid collision errors if it was estimated locally
                        // The DB trigger or logic should handle it, but here we insert and get real data
                        const { id: tempId, ticket_number, ...insertData } = mutation.payload;
                        
                        // We fetch the latest queue settings to be safe? 
                        // Or just let the DB/service handle it. 
                        // For simplicity, we assume we insert with 'user_id' and 'name' etc.
                        // We DO NOT send the ticket_number to let the backend/trigger logic handle it if possible,
                        // OR we trust the offline calculation if we want.
                        // Let's rely on the service logic logic or minimal insert.
                        // But wait, our 'addPatient' adds to 'patients' table.
                        // We need to re-fetch the correct ticket number OR accept there might be gaps/duplicates if we force it.
                        // Safest: re-calculate ticket number on server side if we had a stored procedure.
                        // Since we don't, we just insert. We will let the DB assign the sequence if we used serials,
                        // but we use 'queue_settings'.
                        // We should re-run the "get next ticket" logic here?
                        // Yes, basic logic:
                        
                        // 1. Get next ticket
                        // Logic duplicated from patients.ts - not ideal but robust for this script
                        let { data: settings } = await supabase.from('queue_settings').select('*').eq('user_id', user.id).single();
                        const nextNum = (settings?.last_ticket_number || 0) + 1;
                        await supabase.from('queue_settings').update({ last_ticket_number: nextNum }).eq('user_id', user.id);
                        
                        // 2. Insert
                        const { data: inserted, error: insertError } = await supabase.from('patients').insert({
                            ...insertData,
                            ticket_number: nextNum.toString(),
                            user_id: user.id
                        }).select().single();

                        if (insertError) throw insertError;

                        // 3. Map ID
                        if (tempId && inserted) {
                            idMap.set(tempId, inserted.id);
                        }
                        break;

                    case 'UPDATE_STATUS':
                        await supabase
                            .from('patients')
                            .update({ status: mutation.payload.status })
                            .eq('id', mutation.payload.id);
                        break;
                        
                    case 'UPDATE_PATIENT':
                         const { id: uId, ...updates } = mutation.payload;
                         await supabase
                            .from('patients')
                            .update(updates)
                            .eq('id', uId);
                        break;

                     case 'DELETE_PATIENT':
                        await supabase
                            .from('patients')
                            .delete()
                            .eq('id', mutation.payload.id);
                        break;
                }
                successCount++;
            } catch (err) {
                console.error("Sync failed for mutation:", mutation, err);
                errorCount++;
            }
        }

        // Remove processed items (or all for now)
        this.clearQueue();

        toast.dismiss("sync-process");
         if (successCount > 0) {
             toast.success(`${successCount} actions synchronisées !`);
             // Force page reload to refresh all data states? Or trigger an event.
             // Forcing a refresh might be jarring but ensures consistency.
             // Better: trigger a re-fetch.
             window.location.reload(); 
        } else if (errorCount > 0) {
            toast.error(`${errorCount} omissions lors de la synchronisation.`);
        }
    }
}
