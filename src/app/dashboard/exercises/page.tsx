"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Exercise {
    id: number;
    content: {
        question: string;
        level: string;
        topic: string;
    };
    status: 'pending' | 'validated' | 'rejected';
    lock?: {
        locked_by: string;
        locked_at: string;
        profiles: {
            full_name: string;
        };
    };
}

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const BYPASS_AUTH = true;

    useEffect(() => {
        const fetchData = async () => {
            if (BYPASS_AUTH) {
                setCurrentUser({
                    id: "dev-user",
                    user_metadata: { full_name: "Développeur" }
                });
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUser(user);
            }

            // Fetch exercises with locks
            const { data, error } = await supabase
                .from("exercises")
                .select(`
          *,
          lock:locks(
            locked_by,
            locked_at,
            profiles(full_name)
          )
        `)
                .order('id', { ascending: true })
                .limit(50);

            if (data) {
                setExercises(data as any);
            }
            setLoading(false);
        };

        fetchData();

        // Subscribe to changes (Realtime)
        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'locks' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'exercises' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'validated': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-orange-100 text-orange-700 border-orange-200';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-secondary">Liste des Exercices</h3>
                    <p className="text-muted">Sélectionnez un exercice pour commencer la validation.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Rechercher un exercice..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-64 text-sm"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-muted uppercase tracking-wider">
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Sujet / Niveau</th>
                            <th className="px-6 py-4">Aperçu</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4">Lock</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {exercises.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted italic">
                                    Aucun exercice trouvé. Importez-en pour commencer.
                                </td>
                            </tr>
                        ) : exercises.map((ex) => (
                            <tr key={ex.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs font-bold text-secondary">#MATH-{ex.id}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-secondary">{ex.content.topic}</span>
                                        <span className="text-xs text-muted">{ex.content.level}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs overflow-hidden truncate italic text-sm text-gray-600">
                                    {ex.content.question}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(ex.status)}`}>
                                        {ex.status === 'pending' ? 'À valider' : ex.status === 'validated' ? 'Validé' : 'Rejeté'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {ex.lock ? (
                                        <div className="flex items-center space-x-2" title={`Verrouillé par ${ex.lock.profiles.full_name}`}>
                                            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                            <span className="text-xs font-semibold text-orange-600 truncate max-w-[100px]">
                                                {ex.lock.locked_by === currentUser?.id ? 'Moi' : ex.lock.profiles.full_name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-medium text-gray-400">Libre</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/dashboard/exercises/${ex.id}`}
                                        className={`inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-bold transition-all ${ex.lock && ex.lock.locked_by !== currentUser?.id
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow active:scale-[0.98]"
                                            }`}
                                    >
                                        {ex.lock && ex.lock.locked_by === currentUser?.id ? 'Continuer' : 'Ouvrir'}
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted">Affichage de 1 à {Math.min(50, exercises.length)} sur {exercises.length} exercices</p>
                <div className="flex space-x-2">
                    <button className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-primary/20">1</button>
                    <button className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">2</button>
                    <button className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
