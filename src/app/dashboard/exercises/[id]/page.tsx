"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ExerciseContent {
    question: string;
    answer: string;
    level: string;
    topic: string;
    explanation: string;
}

export default function ExerciseDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [exercise, setExercise] = useState<any>(null);
    const [content, setContent] = useState<ExerciseContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const BYPASS_AUTH = true;

    const acquireLock = useCallback(async (userId: string) => {
        if (BYPASS_AUTH && userId === "dev-user") {
            // Force a valid lock for dev mode if needed, or just return true
            // Supabase might fail if "dev-user" isn't a valid UUID, but we can bypass the DB call
            return true;
        }
        const { error: lockError } = await supabase
            .from("locks")
            .upsert({ exercise_id: id, locked_by: userId }, { onConflict: 'exercise_id' });

        if (lockError) {
            console.error("Lock error:", lockError);
            return false;
        }
        return true;
    }, [id, BYPASS_AUTH]);

    const releaseLock = useCallback(async () => {
        if (BYPASS_AUTH) return; // Skip in dev mode to avoid errors
        if (id) {
            await supabase.from("locks").delete().eq("exercise_id", id);
        }
    }, [id, BYPASS_AUTH]);

    useEffect(() => {
        const fetchExercise = async () => {
            let userId = "";
            if (BYPASS_AUTH) {
                const user = { id: "dev-user", user_metadata: { full_name: "Développeur" } };
                setCurrentUser(user);
                userId = user.id;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return router.push("/auth/login");
                setCurrentUser(user);
                userId = user.id;
            }

            // Try to acquire lock first
            const lockSuccess = await acquireLock(userId);
            if (!lockSuccess) {
                setError("Impossible de verrouiller l'exercice. Il est peut-être déjà utilisé.");
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from("exercises")
                .select("*")
                .eq("id", id)
                .single();

            if (fetchError || !data) {
                setError("Exercice non trouvé.");
            } else {
                setExercise(data);
                setContent(data.content);
            }
            setLoading(false);
        };

        fetchExercise();

        // Unlock on back/leave
        const handleBeforeUnload = () => releaseLock();
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            releaseLock();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [id, router, acquireLock, releaseLock]);

    const handleSave = async (status: 'pending' | 'validated' | 'rejected') => {
        setSaving(true);
        try {
            const { error: updateError } = await supabase
                .from("exercises")
                .update({
                    content,
                    status,
                    validated_by: status !== 'pending' ? currentUser?.id : null,
                    updated_at: new Date()
                })
                .eq("id", id);

            if (updateError) throw updateError;

            // Log activity
            await supabase.from("audit_logs").insert({
                user_id: currentUser?.id,
                action: `exercise_${status}`,
                target_id: id,
                details: content
            });

            router.push("/dashboard/exercises");
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
            <p className="text-red-600 font-bold mb-4">{error}</p>
            <Link href="/dashboard/exercises" className="text-primary font-bold hover:underline">
                Retour à la liste
            </Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard/exercises" className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <div>
                        <h3 className="text-2xl font-bold text-secondary">Édition de l'exercice #MATH-{id}</h3>
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-orange-500 font-bold flex items-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-2 animate-pulse" />
                                Verrouillé pour édition
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleSave('pending')}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-secondary font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Sauvegarder
                    </button>
                    <button
                        onClick={() => handleSave('validated')}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {saving ? "Validation..." : "Valider"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Editor Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary uppercase tracking-wider">Question / Énoncé</label>
                            <textarea
                                value={content?.question}
                                onChange={(e) => setContent({ ...content!, question: e.target.value })}
                                className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg resize-none font-medium leading-relaxed"
                                placeholder="Écrivez l'énoncé de l'exercice ici..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary uppercase tracking-wider">Réponse / Solution</label>
                            <textarea
                                value={content?.answer}
                                onChange={(e) => setContent({ ...content!, answer: e.target.value })}
                                className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg resize-none font-bold text-primary"
                                placeholder="La réponse attendue..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-secondary uppercase tracking-wider">Explication (facultatif)</label>
                            <textarea
                                value={content?.explanation}
                                onChange={(e) => setContent({ ...content!, explanation: e.target.value })}
                                className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm text-muted resize-none"
                                placeholder="Explication détaillée de la démarche..."
                            />
                        </div>
                    </div>
                </div>

                {/* Metadata Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                        <h4 className="font-bold text-secondary border-b border-gray-50 pb-4">Classification</h4>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted uppercase">Niveau</label>
                                <select
                                    value={content?.level}
                                    onChange={(e) => setContent({ ...content!, level: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary font-semibold text-secondary"
                                >
                                    <option value="CE2">CE2</option>
                                    <option value="CM1">CM1</option>
                                    <option value="CM2">CM2</option>
                                    <option value="6ème">6ème</option>
                                    <option value="5ème">5ème</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted uppercase">Thème</label>
                                <input
                                    type="text"
                                    value={content?.topic}
                                    onChange={(e) => setContent({ ...content!, topic: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary font-semibold text-secondary"
                                    placeholder="Ex: Fractions"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                        <h4 className="font-bold text-red-600 mb-2">Zone Critique</h4>
                        <p className="text-xs text-red-500/80 mb-4 font-medium">Si l'exercice est erroné ou ne respecte pas les standards, rejetez-le.</p>
                        <button
                            onClick={() => handleSave('rejected')}
                            disabled={saving}
                            className="w-full py-2.5 rounded-xl bg-white border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                            Rejeter l'exercice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
