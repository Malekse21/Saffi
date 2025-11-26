import React from 'react';

export interface PricingPlan {
    name: string;
    price: number;
    color: 'yellow' | 'indigo';
    features: string[];
    cta: string;
    popular?: boolean;
}

export interface Feature {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
}

export enum InterfaceType {
    PATIENT = 'PATIENT',
    SECRETARY = 'SECRETARY',
    TV = 'TV'
}
