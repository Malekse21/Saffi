import React from 'react';
import { 
    Stethoscope, 
    Baby, 
    Eye, 
    Bone, 
    ScanLine, 
    Smile, 
    User,
    Activity,
    HeartPulse,
    Brain,
    LucideProps
} from 'lucide-react';

interface DynamicIconProps extends LucideProps {
    name: string;
}

// Map string names to actual components
const IconMap: Record<string, React.FC<LucideProps>> = {
    Stethoscope,
    Baby,
    Eye,
    Bone,
    ScanLine,
    Smile,
    User,
    Activity,
    HeartPulse,
    Brain
};

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
    const IconComponent = IconMap[name] || Stethoscope;
    
    return <IconComponent {...props} />;
};
