"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        validated: 0,
        rejected: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data: exercises } = await supabase.from("exercises").select("status");
            if (exercises) {
                const newStats = {
                    total: 12000,
                    pending: exercises.filter(e => e.status === 'pending').length + (12000 - exercises.length),
                    validated: exercises.filter(e => e.status === 'validated').length,
                    rejected: exercises.filter(e => e.status === 'rejected').length,
                };
                setStats(newStats);
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    const handleExport = async (format: 'json' | 'csv') => {
        const { data, error } = await supabase
            .from("exercises")
            .select("*")
            .eq("status", "validated");

        if (error) {
            alert("Erreur lors de l'exportation : " + error.message);
            return;
        }

        const content = format === 'json'
            ? JSON.stringify(data, null, 2)
            : data.map(ex => `${ex.id},"${ex.content.topic}","${ex.content.level}","${ex.content.question.replace(/"/g, '""')}"`).join('\n');

        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exercices_valides_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
    };


    const statCards = [
        { name: "Total d'exercices", value: stats.total, color: "bg-blue-500" },
        { name: "En attente", value: stats.pending, color: "bg-orange-500" },
        { name: "Validés", value: stats.validated, color: "bg-green-500" },
        { name: "Rejetés", value: stats.rejected, color: "bg-red-500" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-secondary">Vue d'ensemble</h3>
                    <p className="text-muted text-lg">Suivez la progression de la validation en temps réel.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleExport('json')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-secondary hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Export JSON</span>
                    </button>
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-secondary hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => (
                    <div key={card.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className={`h-2 w-12 rounded-full ${card.color} mb-4`} />
                        <p className="text-sm font-semibold text-muted uppercase tracking-wider">{card.name}</p>
                        <p className="text-3xl font-extrabold text-secondary mt-1">
                            {loading ? "..." : card.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Progress Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-secondary">Progression Globale</h4>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {((stats.validated / stats.total) * 100).toFixed(1)}% complété
                    </span>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-1000 ease-out"
                        style={{ width: `${(stats.validated / stats.total) * 100}%` }}
                    />
                </div>
                <div className="mt-4 flex justify-between text-xs font-bold text-muted uppercase">
                    <span>Début</span>
                    <span>Objectif: 12,000</span>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="text-lg font-bold text-secondary mb-4">Dernières Validations</h4>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center text-green-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-secondary">Exercice #MATH-{1000 + i}</p>
                                        <p className="text-xs text-muted">Validé par Jean Dupont</p>
                                    </div>
                                </div>
                                <span className="text-xs text-muted">Il y a {i * 10} min</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="text-lg font-bold text-secondary mb-4">Exercices en cours</h4>
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center text-orange-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-secondary">Exercice #MATH-{2000 + i}</p>
                                        <p className="text-xs text-muted">Verrouillé par Marie Curie</p>
                                    </div>
                                </div>
                                <span className="text-xs text-orange-500 font-bold">Verrouillé</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
