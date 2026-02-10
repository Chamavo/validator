"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Register() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (signUpError) throw signUpError;

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
                <div className="w-full max-w-[480px] space-y-8 text-center">
                    <div className="flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-secondary">Demande envoyée !</h1>
                    <p className="text-lg text-muted">
                        Votre demande d'inscription a été envoyée à <span className="font-semibold text-secondary">yvesnya@yahoo.com</span>.
                    </p>
                    <p className="text-muted">
                        Vous recevrez un e-mail dès que votre compte aura été approuvé par l'administrateur.
                    </p>
                    <Link
                        href="/"
                        className="inline-block pt-4 font-bold text-primary hover:underline"
                    >
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
            <main className="w-full max-w-[480px] space-y-8 py-12">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-secondary">Créer votre compte</h1>
                    <p className="text-muted text-lg">
                        Rejoignez l'espace de travail pour commencer la validation.
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary" htmlFor="name">
                            Nom complet
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex h-12 w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Ex: Jean Dupont"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary" htmlFor="email">
                            Adresse e-mail
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex h-12 w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="nom@exemple.com"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary" htmlFor="password">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex h-12 w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Votre mot de passe"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg bg-primary font-bold text-white shadow-md transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isLoading ? "Inscription en cours..." : "S'inscrire"}
                    </button>
                </form>

                <p className="text-center text-sm text-muted">
                    Déjà un compte ?{" "}
                    <Link href="/auth/login" className="font-bold text-primary hover:underline">
                        Se connecter
                    </Link>
                </p>
            </main>
        </div>
    );
}

