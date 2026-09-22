import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { SPECIALTIES } from '@/lib/specialties';
import { DynamicIcon } from '@/components/DynamicIcon';
import JoinQueueForm from '@/components/patient/JoinQueueForm';
import { Toaster } from 'sonner';

export default async function PatientJoinPage({ params }: { params: { slug: string } }) {
    const supabase = createClient();

    // 1. Fetch Doctor Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, clinic_name, specialty, full_name')
        .eq('slug', params.slug)
        .single();

    if (!profile) {
        return notFound();
    }

    // 2. Determine Configuration
    // If specialty exists but isn't in our config, fallback to generaliste
    const specialtyKey = profile.specialty || 'generaliste';
    const config = SPECIALTIES[specialtyKey] || SPECIALTIES['generaliste'];

    // 3. Handle Form Submission (Server Action or pass to client? The user pattern suggests Client Component logic for submission usually,
    // but here we just pass props to JoinQueueForm. Integration logic is inside JoinQueueForm usually or we'll mock it for now
    // wait, JoinQueueForm needs an onSubmit prop. I will pass a dummy function or use a Server Action?
    // For simplicity in this step, JoinQueueForm is a Client Component, so it will handle the submit via API or Supabase client directly.
    // I need to update JoinQueueForm to handle the actual submission logic internally or pass a server action. 
    // The previous Turn 5 Request asked me to "Pass properties...". I'll wrap JoinQueueForm with a logic wrapper or update it to be smart.
    // Actually, looking at previous JoinQueueForm implementation, it takes `onSubmit`.
    // I will Create a Client Wrapper for the Page Logic or just let JoinQueueForm handle the mutation using supabase-js client side?
    // Let's make a wrapper component `JoinQueueContainer` to keep this page clean Server Component?
    // Or simpler: I will render a client component `JoinQueueView` passing the profile and config.
    
    // BUT wait, the prompt asked for "The Patient Page Logic" code.
    // And "The Patient Form".
    
    // I will write a simple "Client Wrapper" in `components/patient/JoinQueueContainer.tsx` or handle it in `JoinQueueForm`?
    // Let's modify `JoinQueueForm` to just take `profileId` and handle submission itself? 
    // The prompt implementation requirement "Update the form... Props: motifs, UI Logic..." didn't specify internal submission logic.
    // I'll create a smarter client component for the whole view to handle interactions.
    
    // Let's stick to the prompt's `app/join/[slug]/page.tsx`.
    
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <Toaster position="top-center" />
            
            <div className="w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden">
                {/* Hero Section */}
                <div className="bg-gray-50 border-b-2 border-black p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                        <DynamicIcon name={config.icon} className="w-10 h-10 text-black" />
                    </div>
                    
                    <div>
                        <h1 className="text-2xl font-black font-display uppercase tracking-tight">
                            {profile.clinic_name || `Dr. ${profile.full_name}`}
                        </h1>
                        <div className="inline-block mt-2 px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full">
                            {config.label}
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    {/* We need a Client Component that handles the submission. 
                        I'll use a wrapper since props cannot carry functions over the network boundary easily if they are not Server Actions.
                    */}
                    <ClientJoinLogic 
                        motifs={config.motifs} 
                        clinicId={profile.id}
                    />
                </div>
            </div>
            
             <p className="mt-8 text-xs font-bold uppercase text-gray-400 tracking-widest">
                Powered by Saffi
            </p>
        </div>
    );
}

// I need to define ClientJoinLogic or import it. 
// Since I can't write two files in one step easily if I want to be clean, 
// I'll assume `components/patient/ClientJoinLogic.tsx` exists or put it in `JoinQueueForm`.
// Actually, `JoinQueueForm` defined in previous step took `onSubmit`. 
// I should probably update `JoinQueueForm` or wrap it.
// Let's use `JoinQueueForm` but I need to pass the logic. 
// I will create `components/patient/JoinPageClient.tsx` to wrap the form and handle submission.
