"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Profile {
    id: string;
    full_name: string;
    role: 'admin' | 'validator';
    is_approved: boolean;
    created_at: string;
}

export default function UsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const BYPASS_AUTH = true;

    const fetchProfiles = async () => {
        setLoading(true);
        if (BYPASS_AUTH) {
            setProfiles([
                {
                    id: "dev-user",
                    full_name: "Développeur",
                    role: 'admin',
                    is_approved: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: "user-1",
                    full_name: "Jean Dupont",
                    role: 'validator',
                    is_approved: true,
                    created_at: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: "user-2",
                    full_name: "Marie Curie",
                    role: 'validator',
                    is_approved: false,
                    created_at: new Date(Date.now() - 172800000).toISOString()
                }
            ]);
            setLoading(false);
            return;
        }
        const { data, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .order('created_at', { ascending: false });

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setProfiles(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleToggleApproval = async (id: string, currentStatus: boolean) => {
        if (BYPASS_AUTH) {
            setProfiles(profiles.map(p => p.id === id ? { ...p, is_approved: !currentStatus } : p));
            return;
        }
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ is_approved: !currentStatus })
            .eq("id", id);

        if (updateError) {
            alert("Erreur lors de la mise à jour : " + updateError.message);
        } else {
            setProfiles(profiles.map(p => p.id === id ? { ...p, is_approved: !currentStatus } : p));
        }
    };

    const handleChangeRole = async (id: string, newRole: 'admin' | 'validator') => {
        if (BYPASS_AUTH) {
            setProfiles(profiles.map(p => p.id === id ? { ...p, role: newRole } : p));
            return;
        }
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: newRole })
            .eq("id", id);

        if (updateError) {
            alert("Erreur lors du changement de rôle : " + updateError.message);
        } else {
            setProfiles(profiles.map(p => p.id === id ? { ...p, role: newRole } : p));
        }
    };

    if (loading && profiles.length === 0) return (
        <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-secondary">Gestion des Utilisateurs</h3>
                <p className="text-muted">Approuvez les nouveaux validateurs et gérez les rôles.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 italic text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-muted uppercase tracking-wider">
                            <th className="px-6 py-4">Utilisateur</th>
                            <th className="px-6 py-4">Rôle</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4">Date d'inscription</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {profiles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted italic">
                                    Aucun utilisateur trouvé.
                                </td>
                            </tr>
                        ) : profiles.map((profile) => (
                            <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-secondary font-bold">
                                            {profile.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-secondary">{profile.full_name}</span>
                                            <span className="text-xs text-muted truncate max-w-[150px]">{profile.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={profile.role}
                                        onChange={(e) => handleChangeRole(profile.id, e.target.value as any)}
                                        className="text-xs font-bold p-1 rounded border border-gray-200 bg-white text-secondary outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="validator">Validateur</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${profile.is_approved
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-orange-100 text-orange-700 border-orange-200'
                                        }`}>
                                        {profile.is_approved ? 'Approuvé' : 'En attente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted">
                                    {new Date(profile.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleToggleApproval(profile.id, profile.is_approved)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${profile.is_approved
                                            ? 'text-red-500 hover:bg-red-50 border border-red-100'
                                            : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
                                            }`}
                                    >
                                        {profile.is_approved ? 'Désapprouver' : 'Approuver'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
