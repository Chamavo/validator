"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (user) {
                // Check if user is approved
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("is_approved")
                    .eq("id", user.id)
                    .single();

                if (profileError) throw profileError;

                if (!profile?.is_approved) {
                    await supabase.auth.signOut();
                    throw new Error("Votre compte est en attente d'approbation par un administrateur.");
                }

                // Redirect to dashboard (home for now)
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de la connexion.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
            <main className="w-full max-w-[480px] space-y-8 py-12">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-secondary">Se connecter</h1>
                    <p className="text-muted text-lg">
                        Entrez vos identifiants pour accéder à l'espace de travail.
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-secondary" htmlFor="password">
                                Mot de passe
                            </label>
                            <Link href="#" className="text-xs font-bold text-primary hover:underline">
                                Mot de passe oublié ?
                            </Link>
                        </div>
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
                        {isLoading ? "Connexion en cours..." : "Se connecter"}
                    </button>
                </form>

                <p className="text-center text-sm text-muted">
                    Nouveau sur La Ligue des Maths ?{" "}
                    <Link href="/auth/register" className="font-bold text-primary hover:underline">
                        Créer un compte
                    </Link>
                </p>
            </main>
        </div>
    );
}

