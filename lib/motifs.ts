export const MOTIFS = [
    { value: 'consultation', label: 'Consultation', color: 'bg-blue-200', isPublic: true },
    { value: 'controle', label: 'Contrôle', color: 'bg-green-200', isPublic: true },
    { value: 'recuperation', label: 'Récupération du papier', color: 'bg-gray-200', isPublic: true },
    { value: 'delegue_medical', label: 'Délégué Médical', color: 'bg-purple-200', isPublic: true },
    { value: 'urgence', label: 'Urgence', color: 'bg-red-500 text-white', isPublic: false },
] as const;

export type MotifValue = typeof MOTIFS[number]['value'];

export const getMotifByValue = (value: string) => {
    return MOTIFS.find(m => m.value === value) || MOTIFS[0];
};
