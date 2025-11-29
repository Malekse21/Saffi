import { createClient } from "@/utils/supabase/server";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in to view your profile.</div>;
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        console.error("Error fetching profile:", error);
        // This could be a new user, so we should provide a default profile object
        // to the form, but indicate that it's a new profile.
        const defaultProfile = {
            id: user.id,
            email: user.email,
            first_name: '',
            last_name: '',
            specialty: '',
            phone: '',
            address: '',
            bio: '',
            license_number: '',
            cabinet_name: '',
        };
        return <ProfileForm profile={defaultProfile} />;
    }

    return <ProfileForm profile={profile} />;
}