import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

export function Layout({ children }) {
    const { loading } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (loading) {
        return null;
    }

    return (
        <div
            className="scrollbar-sutil flex h-dvh flex-col overflow-y-auto"
            style={{
                background: "linear-gradient(to bottom, #F3F4FA 25%, #C7E9F5 100%)",
                backgroundAttachment: "fixed",
            }}
        >
            <div className="flex flex-1">
                <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

                {mobileMenuOpen && (
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px] lg:hidden"
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col lg:ml-[219px]">
                    <Header onMenuOpen={() => setMobileMenuOpen(true)} />
                    <main className="min-w-0 flex-1">{children}</main>
                </div>
            </div>

            <footer className="flex h-[117px] w-full items-center justify-center px-4 lg:pl-[219px]">
                <p className="text-center text-sm font-medium text-[#4696AD]">
                    Filo® | Onde negócios fluem, resultados acontecem
                </p>
            </footer>
        </div>
    );
}
