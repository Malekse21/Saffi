export const MOTIFS = [
    { 
        value: 'consultation', 
        label: 'Consultation', 
        color: 'bg-blue-100 text-blue-900 border-blue-600',
        weight: 1.0, // Standard time
        isPublic: true 
    },
    { 
        value: 'controle', 
        label: 'Contrôle', 
        color: 'bg-green-100 text-green-900 border-green-600',
        weight: 0.5, // 50% of standard time
        isPublic: true 
    },
    { 
        value: 'recuperation', 
        label: 'Récupération du papier', 
        color: 'bg-gray-100 text-gray-900 border-gray-600',
        weight: 0.1, // Very fast (just pickup)
        isPublic: true 
    },
    { 
        value: 'delegue_medical', 
        label: 'Délégué Médical', 
        color: 'bg-purple-100 text-purple-900 border-purple-600',
        weight: 0.5,
        isPublic: true 
    },
    { 
        value: 'urgence', 
        label: 'Urgence', 
        color: 'bg-red-500 text-white border-red-800',
        weight: 1.0,
        isPublic: false 
    },
] as const;

export type MotifValue = typeof MOTIFS[number]['value'];

export const getMotifByValue = (value: string) => {
    return MOTIFS.find(m => m.value === value) || MOTIFS[0];
};

