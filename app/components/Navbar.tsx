"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAdminEmail, isValidAccountEmail } from "../../lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isLoginPage = pathname === "/login" || pathname === "/login/";

  useEffect(() => {
    const session = document.cookie
      .split("; ")
      .find((item) => item.startsWith("skatementor_session="))
      ?.split("=")[1];

    if (!session) {
      setIsAuthenticated(false);
      setIsAdmin(false);
      return;
    }

    try {
      setIsAuthenticated(isValidAccountEmail(decodeURIComponent(session)));
      setIsAdmin(isAdminEmail(decodeURIComponent(session)));
    } catch {
      setIsAuthenticated(false);
    }
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = "skatementor_session=; path=/; max-age=0; SameSite=Lax";
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-6xl mx-auto px-gutter-mobile md:px-gutter flex items-center justify-between gap-space-md">
        <div className="flex items-center">
          <Link
            className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface"
            href={isLoginPage ? "/login" : "/"}
          >
            SkateMentor
          </Link>
        </div>

        {!isLoginPage && (
          <>
            <nav className="hidden md:flex items-center gap-space-lg">
              <Link
                className="font-label-md text-label-md text-primary font-bold transition-colors"
                href="/#skatersGrid"
              >
                Catálogo de Skaters
              </Link>
              <Link
                className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
                href="/#como-funciona"
              >
                Cómo Funciona
              </Link>
            </nav>

            <div className="flex items-center gap-space-sm md:gap-space-md">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link
                      className="inline-flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm"
                      href="/nuevo-skater"
                    >
                      <span>Añadir Skater</span>
                      <span className="material-symbols-outlined text-[16px]">
                        add
                      </span>
                    </Link>
                  )}

                  <button
                    aria-label="Cerrar sesión"
                    className="inline-flex items-center gap-1.5 bg-surface-container hover:bg-error-container text-on-surface hover:text-on-error-container font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors cursor-pointer"
                    title="Cerrar sesión"
                    type="button"
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      logout
                    </span>
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </>
              ) : (
                <Link
                  className="inline-flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm"
                  href="/login?next=/"
                >
                  <span>Iniciar sesión</span>
                  <span className="material-symbols-outlined text-[18px]">
                    login
                  </span>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}