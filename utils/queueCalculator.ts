import { MOTIFS } from '@/lib/motifs';

interface QueuePatient {
    id: string;
    motif?: string;
    created_at: string;
    [key: string]: any;
}

/**
 * Calculate estimated wait time based on weighted motifs of patients ahead in queue
 * @param queue - Array of all patients in the queue
 * @param currentPatientId - ID of the patient to calculate wait time for
 * @param doctorAvgTime - Doctor's average consultation time in minutes
 * @returns Estimated wait time in minutes
 */
export const calculateEstWaitTime = (
    queue: QueuePatient[],
    currentPatientId: string,
    doctorAvgTime: number
): number => {
    // Sort queue by created_at (ascending - oldest first)
    const sortedQueue = [...queue].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Find the index of the current patient
    const currentIndex = sortedQueue.findIndex(p => p.id === currentPatientId);
    
    // If patient not found or is first, return 0
    if (currentIndex <= 0) return 0;

    // Get all patients strictly before the current patient
    const patientsAhead = sortedQueue.slice(0, currentIndex);

    // Calculate weighted total time
    const totalMinutes = patientsAhead.reduce((total, patient) => {
        // Look up the motif weight
        const motifConfig = MOTIFS.find(m => m.value === patient.motif);
        const weight = motifConfig?.weight ?? 1.0; // Default to 1.0 if motif not found

        // Add weighted time to total
        return total + (doctorAvgTime * weight);
    }, 0);

    // Return rounded total
    return Math.round(totalMinutes);
};

/**
 * Formats wait time in minutes to a human-readable string
 * @param minutes - Wait time in minutes
 * @returns Formatted string (e.g., "~35 min" or "~1h 30min")
 */
export const formatWaitTime = (minutes: number): string => {
    if (minutes < 60) {
        return `~${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `~${hours}h`;
    }
    
    return `~${hours}h ${remainingMinutes}min`;
};
