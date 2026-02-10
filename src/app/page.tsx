"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 selection:bg-primary/20">
      <main className="w-full max-w-[480px] space-y-8 py-12">
        {/* Header / Logo Section */}
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="flex items-center justify-center p-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20">
              M
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
            {user ? `Ravi de vous revoir, ${user.user_metadata.full_name || 'Validateur'}` : "Bienvenue sur l'espace de travail de La Ligue des Maths."}
          </h1>
          <p className="text-lg text-muted">
            {user
              ? "Vous êtes connecté. Prêt à valider nos futurs génies ?"
              : "Validez et optimisez nos exercices mathématiques avec précision et efficacité."}
          </p>
        </div>

        {/* Buttons Section */}
        <div className="grid gap-4 pt-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex h-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white shadow-md transition-all hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99]"
              >
                Accéder au Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex h-14 items-center justify-center rounded-lg border-2 border-secondary bg-white text-lg font-bold text-secondary transition-all hover:bg-secondary hover:text-white"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/register"
                className="flex h-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white shadow-md transition-all hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99]"
              >
                S'inscrire
              </Link>
              <Link
                href="/auth/login"
                className="flex h-14 items-center justify-center rounded-lg border-2 border-secondary bg-white text-lg font-bold text-secondary transition-all hover:bg-secondary hover:text-white"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>

        {/* Footer / Info Section */}
        <div className="pt-12 text-center">
          <p className="text-sm text-muted">
            {user
              ? "Session active sécurisée par Supabase."
              : "L'inscription nécessite une validation manuelle par l'administrateur."}
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <span className="h-1 w-12 rounded-full bg-border" />
            <span className="h-1 w-4 rounded-full bg-primary/50" />
            <span className="h-1 w-12 rounded-full bg-border" />
          </div>
        </div>
      </main>
    </div>
  );
}

