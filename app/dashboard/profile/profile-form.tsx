"use client";

import { useState, useRef, useEffect } from "react";
import { User, MapPin, Phone, Mail, Briefcase, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfileForm({ profile }: { profile: any }) {
    const supabase = createClient();
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: profile.full_name || "",
        specialty: profile.specialty || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        bio: profile.bio || "",
    });
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load avatar with signed URL on mount
    useEffect(() => {
        const loadAvatar = async () => {
            if (profile.avatar_url) {
                // If avatar_url is a file path (not a full URL), generate signed URL
                if (!profile.avatar_url.startsWith('http')) {
                    const { data } = await supabase.storage
                        .from('avatars')
                        .createSignedUrl(profile.avatar_url, 60 * 60 * 24); // 24 hours

                    if (data?.signedUrl) {
                        setAvatarUrl(data.signedUrl);
                    }
                } else {
                    setAvatarUrl(profile.avatar_url);
                }
            }
        };
        loadAvatar();
    }, [profile.avatar_url, supabase]);

    const capitalizeWords = (str: string) => {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Auto-capitalize all text fields (except email which should be lowercase)
        if (name !== 'email' && name !== 'phone') {
            setFormData({ ...formData, [name]: capitalizeWords(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            toast.error("Erreur lors de l'upload de l'avatar.");
            console.error('Error uploading avatar:', uploadError);
            setUploading(false);
            return;
        }

        // For private buckets, we store the file path and generate signed URLs when needed
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: filePath })
            .eq('id', profile.id);

        if (updateError) {
            toast.error("Erreur lors de la mise à jour du profil.");
            console.error('Error updating profile avatar url:', updateError);
        } else {
            // Generate signed URL for display
            const { data } = await supabase.storage
                .from('avatars')
                .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours

            if (data?.signedUrl) {
                setAvatarUrl(data.signedUrl);
            }

            router.refresh();
        }

        setUploading(false);
    };

    const handleSave = async () => {
        // Auto-generate clinic name
        const clinicName = formData.fullName ? `Cabinet Dr. ${formData.fullName}` : '';

        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: formData.fullName,
                clinic_name: clinicName,
                specialty: formData.specialty,
                phone: formData.phone,
                address: formData.address,
                bio: formData.bio,
            })
            .eq("id", profile.id);

        if (error) {
            toast.error("Erreur lors de la mise à jour du profil.");
            console.error("Error updating profile:", error);
        } else {
            toast.success("✅ Profil enregistré!", {
                duration: 3000,
                style: {
                    background: '#10b981',
                    color: 'white',
                    fontWeight: 'bold',
                },
            });
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b-2 border-black pb-4">
                <h1 className="text-3xl font-black uppercase">Mon Profil</h1>
                <p className="text-gray-500 font-medium mt-1">Gérez vos informations professionnelles</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Photo Section */}
                <div className="lg:col-span-1">
                    <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_#000] space-y-4">
                        <h2 className="text-xl font-bold uppercase mb-4">Photo de Profil</h2>

                        <div className="flex flex-col items-center gap-4">
                            <div className="h-40 w-40 rounded-full border-4 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
                                {avatarUrl ? (
                                    <Image src={avatarUrl} alt="Avatar" width={160} height={160} className="object-cover" />
                                ) : (
                                    <User className="h-20 w-20 text-gray-400" />
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/png, image/jpeg"
                                disabled={uploading}
                            />
                            <button
                                className="flex items-center gap-2 border-2 border-black bg-black px-4 py-2 font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Upload className="h-4 w-4" />
                                {uploading ? 'Chargement...' : 'Changer la Photo'}
                            </button>
                        </div>

                        <div className="border-t-2 border-black pt-4 mt-4">
                            <p className="text-sm text-gray-600 font-medium">
                                Formats acceptés: JPG, PNG
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                                Taille max: 2MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Information Form */}
                <div className="lg:col-span-2">
                    <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_#000] space-y-6">
                        <h2 className="text-xl font-bold uppercase mb-4">Informations Personnelles</h2>

                        {/* Full Name Field */}
                        <div>
                            <label className="block text-sm font-bold mb-2 uppercase">
                                <User className="inline h-4 w-4 mr-2" />
                                Nom Complet
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="block text-sm font-bold mb-2 uppercase">
                                <Briefcase className="inline h-4 w-4 mr-2" />
                                Spécialité
                            </label>
                            <input
                                type="text"
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleChange}
                                className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        {/* Contact Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 uppercase">
                                    <Mail className="inline h-4 w-4 mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled
                                    className="w-full border-2 border-black px-4 py-3 font-medium bg-gray-100 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 uppercase">
                                    <Phone className="inline h-4 w-4 mr-2" />
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-bold mb-2 uppercase">
                                <MapPin className="inline h-4 w-4 mr-2" />
                                Adresse
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-bold mb-2 uppercase">
                                Biographie
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={4}
                                className="w-full border-2 border-black px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-black resize-none"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4 border-t-2 border-black">
                            <button
                                onClick={handleSave}
                                className="border-2 border-black bg-black px-8 py-3 font-bold text-white shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900"
                            >
                                Enregistrer les Modifications
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
