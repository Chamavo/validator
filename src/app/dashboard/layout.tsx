"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth/login");
                return;
            }

            // Check approval
            const { data: profile } = await supabase
                .from("profiles")
                .select("is_approved, role")
                .eq("id", user.id)
                .single();

            if (!profile?.is_approved) {
                await supabase.auth.signOut();
                router.push("/auth/login?error=unapproved");
                return;
            }

            setUser({ ...user, profile });
            setLoading(false);
        };
        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 text-secondary">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium animate-pulse text-muted">Chargement de votre espace...</p>
                </div>
            </div>
        );
    }

    const navItems = [
        {
            name: "Aperçu", href: "/dashboard", icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: "Exercices", href: "/dashboard/exercises", icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
    ];

    if (user?.profile?.role === 'admin') {
        navItems.push({
            name: "Utilisateurs", href: "/dashboard/users", icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        });
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside className="w-64 bg-secondary text-white hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
                            M
                        </div>
                        <span className="font-bold text-xl tracking-tight leading-none">Validator</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${pathname === item.href
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <span className={`${pathname === item.href ? "text-white" : "text-gray-400 group-hover:text-primary"} transition-colors`}>
                                {item.icon}
                            </span>
                            <span className="font-semibold">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold truncate">{user?.user_metadata?.full_name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.profile?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-bold text-white bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                        >
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-secondary">
                        {navItems.find(item => item.href === pathname)?.name || "Dashboard"}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
