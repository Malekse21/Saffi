import { Stethoscope, Baby, Eye, Bone, Aperture } from 'lucide-react';

export interface SpecialtyConfig {
  label: string;
  icon: string; // Corresponds to Lucide React component names
  motifs: { value: string; label: string; isPublic: boolean }[];
}

export const SPECIALTIES: Record<string, SpecialtyConfig> = {
  // 1. MÉDECINE GÉNÉRALE (The Standard)
  generaliste: {
    label: "Médecine Générale",
    icon: "Stethoscope",
    motifs: [
      { value: 'consultation', label: 'Consultation', isPublic: true },
      { value: 'controle', label: 'Contrôle', isPublic: true },
      { value: 'certificat', label: 'Certificat / Aptitude', isPublic: true },
      { value: 'renouvellement', label: 'Renouvellement Ordonnance', isPublic: true },
      { value: 'injection', label: 'Injection / Pansement', isPublic: true },
      { value: 'delegue', label: 'Délégué Médical', isPublic: true },
    ]
  },

  // 2. PÉDIATRIE
  pediatrie: {
    label: "Pédiatrie",
    icon: "Baby",
    motifs: [
      { value: 'maladie', label: 'Consultation (Enfant Malade)', isPublic: true },
      { value: 'vaccin', label: 'Vaccin', isPublic: true },
      { value: 'suivi', label: 'Suivi de Croissance / Pesée', isPublic: true },
      { value: 'controle', label: 'Contrôle', isPublic: true },
      { value: 'certificat_sport', label: 'Certificat (Crèche/Sport)', isPublic: true },
      { value: 'avis', label: 'Avis / Orientation', isPublic: true },
    ]
  },

  // 3. OPHTALMOLOGIE
  ophtalmo: {
    label: "Ophtalmologie",
    icon: "Eye",
    motifs: [
      { value: 'vision', label: 'Consultation Vision (Lunettes)', isPublic: true },
      { value: 'fond_oeil', label: 'Fond d\'œil (Diabète/HTA)', isPublic: true },
      { value: 'lentilles', label: 'Adaptation Lentilles', isPublic: true },
      { value: 'controle', label: 'Contrôle', isPublic: true },
      { value: 'rougeur', label: 'Infection / Œil Rouge', isPublic: true },
      { value: 'champ_visuel', label: 'Champ Visuel', isPublic: true },
    ]
  },

  // 4. ORTHOPÉDIE
  orthopedie: {
    label: "Orthopédie",
    icon: "Bone", 
    motifs: [
      { value: 'consultation', label: 'Consultation Douleur', isPublic: true },
      { value: 'fracture', label: 'Contrôle Fracture / Radio', isPublic: true },
      { value: 'platre', label: 'Ablation Plâtre / Fils', isPublic: true },
      { value: 'infiltration', label: 'Infiltration', isPublic: true },
      { value: 'trauma', label: 'Traumatisme (Chute/Choc)', isPublic: true },
      { value: 'avis_chir', label: 'Avis Chirurgical', isPublic: true },
    ]
  },

  // 5. RADIOLOGIE
  radiologie: {
    label: "Radiologie",
    icon: "Aperture",
    motifs: [
      { value: 'echo', label: 'Échographie', isPublic: true },
      { value: 'radio', label: 'Radio Standard', isPublic: true },
      { value: 'irm_scanner', label: 'Scanner / IRM', isPublic: true },
      { value: 'mammo', label: 'Mammographie', isPublic: true },
      { value: 'infiltration', label: 'Infiltration Guidée', isPublic: true },
      { value: 'recuperation', label: 'Récupération Résultats', isPublic: true },
    ]
  },

  // FALLBACK (Same as Generaliste)
  autre: {
    label: "Autre Spécialité",
    icon: "Stethoscope",
    motifs: [
      { value: 'consultation', label: 'Consultation', isPublic: true },
      { value: 'controle', label: 'Contrôle', isPublic: true },
      { value: 'certificat', label: 'Certificat / Aptitude', isPublic: true },
      { value: 'renouvellement', label: 'Renouvellement Ordonnance', isPublic: true },
      { value: 'injection', label: 'Injection / Pansement', isPublic: true },
      { value: 'delegue', label: 'Délégué Médical', isPublic: true },
    ]
  }
};
