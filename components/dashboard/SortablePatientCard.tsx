"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PatientCard, Patient } from './PatientCard';

interface SortablePatientCardProps {
    patient: Patient;
}

export function SortablePatientCard({ patient }: SortablePatientCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: patient.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <PatientCard
                patient={patient}
                showDragHandle={true}
            />
        </div>
    );
}
