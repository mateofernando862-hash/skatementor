"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { SKATERS, type SkaterProfile } from "./data/skaters";
import { isAdminEmail, isValidAccountEmail } from "../lib/auth";
import { deleteLocalVideo } from "../lib/local-media";

const REGISTERED_SKATERS_KEY = "skatementor_registered_skaters";
const HIDDEN_DEFAULT_SKATERS_KEY = "skatementor_hidden_default_skaters";

const MODALITY_TABS = ["all", "Street", "Bowl", "Grind & Slide", "Park"];
const QUICK_TAGS = ["Street", "Bowl", "Grind & Slide", "Park", "Freestyle"];

export default function CatalogoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [currentModality, setCurrentModality] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [registeredSkaters, setRegisteredSkaters] = useState<SkaterProfile[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [skaterToDelete, setSkaterToDelete] = useState<SkaterProfile | null>(null);
  const [hiddenDefaultSkaters, setHiddenDefaultSkaters] = useState<number[]>([]);

  useEffect(() => {
    const session = document.cookie
      .split("; ")
      .find((item) => item.startsWith("skatementor_session="))
      ?.split("=")[1];

    if (session) {
      try {
        const email = decodeURIComponent(session);
        setIsAuthenticated(isValidAccountEmail(email));
        setIsAdmin(isAdminEmail(email));
      } catch {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
    }

    try {
      const stored = localStorage.getItem(REGISTERED_SKATERS_KEY);
      setRegisteredSkaters(
        stored ? (JSON.parse(stored) as SkaterProfile[]) : []
      );
    } catch {
      setRegisteredSkaters([]);
    }

    try {
      const stored = localStorage.getItem(HIDDEN_DEFAULT_SKATERS_KEY);
      setHiddenDefaultSkaters(
        stored ? (JSON.parse(stored) as number[]) : []
      );
    } catch {
      setHiddenDefaultSkaters([]);
    }
  }, []);

  const deleteRegisteredSkater = (skater: SkaterProfile) => {
    if (skater.id < 1000) {
      const updated = [...new Set([...hiddenDefaultSkaters, skater.id])];
      localStorage.setItem(
        HIDDEN_DEFAULT_SKATERS_KEY,
        JSON.stringify(updated)
      );
      setHiddenDefaultSkaters(updated);
    } else {
      const updated = registeredSkaters.filter((item) => item.id !== skater.id);
      localStorage.setItem(
        REGISTERED_SKATERS_KEY,
        JSON.stringify(updated)
      );
      deleteLocalVideo(`skater-${skater.id}`).catch(() => undefined);
      setRegisteredSkaters(updated);
    }
    setSkaterToDelete(null);
  };

  const clearDemoCatalog = () => {
    const demoIds = SKATERS.map((skater) => skater.id);
    localStorage.setItem(
      HIDDEN_DEFAULT_SKATERS_KEY,
      JSON.stringify(demoIds)
    );
    setHiddenDefaultSkaters(demoIds);
  };

  const filteredSkaters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return [
      ...SKATERS.filter((skater) => !hiddenDefaultSkaters.includes(skater.id)),
      ...registeredSkaters,
    ].filter((skater) => {
      const matchesQuery =
        !query ||
        skater.name.toLowerCase().includes(query) ||
        skater.bio.toLowerCase().includes(query) ||
        skater.city.toLowerCase().includes(query);

      const matchesCity = !selectedCity || skater.city === selectedCity;

      const matchesModality =
        currentModality === "all" ||
        skater.modalities.some(
          (m) => m.toLowerCase() === currentModality.toLowerCase()
        );

      const matchesLevel =
        selectedLevel === "all" ||
        skater.level === selectedLevel ||
        skater.level === "Todos los niveles";

      let matchesPrice = true;
      if (selectedPrice === "low") matchesPrice = skater.price < 40000;
      if (selectedPrice === "mid")
        matchesPrice = skater.price >= 40000 && skater.price <= 60000;
      if (selectedPrice === "high") matchesPrice = skater.price > 60000;

      return (
        matchesQuery &&
        matchesCity &&
        matchesModality &&
        matchesLevel &&
        matchesPrice
      );
    });
  }, [
    searchQuery,
    selectedCity,
    currentModality,
    selectedLevel,
    selectedPrice,
    registeredSkaters,
    hiddenDefaultSkaters,
  ]);

  const scrollToCatalog = () => {
    document
      .getElementById("skatersGrid")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setCurrentModality("all");
    setSelectedLevel("all");
    setSelectedPrice("all");
  };

  return (
    <div className="flex flex-col w-full">
      {/* HERO SECTION WITH EMBEDDED SEARCH */}
      <section className="relative w-full bg-surface-container-low overflow-hidden py-space-xl">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs self-start px-space-sm py-1 bg-surface-container-highest rounded-full text-on-surface-variant font-label-sm text-label-sm tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Plataforma Oficial · Colombia Skate
              </div>

              <h1 className="font-headline-xl text-[38px] leading-[44px] sm:text-[48px] sm:leading-[56px] text-on-surface tracking-tight text-balance">
                Aprende de los{" "}
                <span className="text-primary underline decoration-primary/30 underline-offset-4">
                  mejores
                </span>{" "}
                sobre la tabla.
              </h1>

              <p className="font-body-lg text-body-lg text-secondary max-w-xl">
                Encuentra tu skater profesional y agenda tu clase técnica 1 a 1 en minutos. Sin intermediarios molestos, directo al spot.
              </p>

              {/* Quick Search Panel */}
              <div className="bg-surface-container-lowest shadow-md rounded-xl p-space-md flex flex-col sm:flex-row items-stretch gap-space-sm mt-space-sm">
                <div className="flex-1 flex items-center gap-space-xs bg-surface-container px-space-sm py-2 rounded-lg">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none"
                    placeholder="Nombre o palabra clave..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-2 rounded-lg sm:w-44">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    location_on
                  </span>
                  <select
                    className="w-full bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    <option value="">Todas las ciudades</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bogotá">Bogotá</option>
                    <option value="Medellín">Medellín</option>
                  </select>
                </div>

                <button
                  className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-space-lg py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  type="button"
                  onClick={scrollToCatalog}
                >
                  <span>Buscar</span>
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>

              {/* Quick modality pill chips */}
              <div className="flex flex-wrap items-center gap-2 pt-space-xs">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Spot rápido:
                </span>
                {QUICK_TAGS.map((mod) => (
                  <button
                    key={mod}
                    className="px-3 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface rounded-full font-label-sm text-label-sm transition-all cursor-pointer"
                    type="button"
                    onClick={() => {
                      setCurrentModality(mod);
                      scrollToCatalog();
                    }}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Kinetic Visual Composite */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-xl bg-surface-container">
                <img
                  alt="Skater profesional realizando kickflip en skatepark"
                  className="w-full h-80 object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyL9OBQ66KBrZuKKHSTiid-eQvVPeh1XUafHJbzzPSpKa1lAp8zxS25D7O6M8TluXxQ2mQ-xDaqYuUvLAApCqZPuPUz7XrNLZPDlmJ1DaVynAL9G3mLanjKYAo1K6M_rLRYDb_1UbG5q4O0RjoIAKHV6qQA1avrInaIOofGYBZynvf9-U_EIqIz_Lj452VDhds2uAsjfWR_8rhhU-wIMnYRwbCeiwEWgYYObypqTY"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-space-md text-on-primary flex items-center justify-between w-full">
                  <div>
                    <p className="font-headline-md text-headline-md font-bold leading-tight">
                      Spot Seguro
                    </p>
                    <p className="font-body-sm text-body-sm text-surface-container-highest">
                      Skateparks municipales avalados
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">
                      skateboarding
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VALUE PROPOSITION METRICS */}
      <section className="w-full bg-surface-container-lowest shadow-sm py-space-lg">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            <div className="flex items-center gap-space-md p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                <span className="material-symbols-outlined text-[26px]">
                  verified
                </span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md font-bold text-on-surface">
                  {SKATERS.filter((skater) => !hiddenDefaultSkaters.includes(skater.id)).length +
                    registeredSkaters.length}{" "}
                  Skaters
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  Instructores certificados y con trayectoria de competencia.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-md p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-fixed shrink-0">
                <span className="material-symbols-outlined text-[26px]">
                  sports
                </span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md font-bold text-on-surface">
                  1 a 1 Personalizado
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  Corrección de postura, stance y trucos a tu propio ritmo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-md p-space-sm rounded-xl hover:bg-surface-container-low transition-colors">
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
                <span className="material-symbols-outlined text-[26px]">
                  chat
                </span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md font-bold text-on-surface">
                  0% Comisiones
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  Acuerdas agenda y tarifa directa vía WhatsApp con tu mentor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG & FILTER SECTION */}
      <section className="w-full py-space-xl" id="skatersGrid">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter flex flex-col gap-space-lg">
          {isAuthenticated ? (
            <>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
            <div>
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase">
                Directorio Activo
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Catálogo de Skaters
              </h2>
            </div>
            {isAdmin && hiddenDefaultSkaters.length < SKATERS.length && (
              <button
                type="button"
                onClick={clearDemoCatalog}
                className="inline-flex items-center justify-center gap-space-xs rounded-lg border border-error/30 bg-error-container/60 px-space-md py-2 text-on-error-container font-label-md text-label-md hover:bg-error-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  delete_sweep
                </span>
                Limpiar catálogo demostrativo
              </button>
            )}
            <p className="font-body-sm text-body-sm text-secondary">
              Mostrando{" "}
              <span className="font-bold text-on-surface">
                {filteredSkaters.length}
              </span>{" "}
              skaters disponibles para sesiones
            </p>
          </div>

          {/* Control / Filter Bar */}
          <div className="bg-surface-container-lowest shadow-sm rounded-xl p-space-md flex flex-col lg:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
              {MODALITY_TABS.map((mod) => {
                const isActive = currentModality === mod;
                return (
                  <button
                    key={mod}
                    className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-secondary hover:bg-surface-container hover:text-on-surface"
                    }`}
                    type="button"
                    onClick={() => setCurrentModality(mod)}
                  >
                    {mod === "all" ? "Todos" : mod}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
              <div className="flex items-center gap-1 bg-surface-container px-space-sm py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  stairs
                </span>
                <select
                  className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <option value="all">Nivel: Todos</option>
                  <option value="Iniciación">Iniciación</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-surface-container px-space-sm py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  payments
                </span>
                <select
                  className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer"
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                >
                  <option value="all">Tarifa: Cualquier precio</option>
                  <option value="low">Menor a $40.000 COP</option>
                  <option value="mid">$40.000 - $60.000 COP</option>
                  <option value="high">Más de $60.000 COP</option>
                </select>
              </div>
            </div>
          </div>

          {/* MENTORS GRID */}
          {filteredSkaters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              {filteredSkaters.map((skater) => (
                <article
                  key={skater.id}
                  className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="relative h-48 w-full bg-surface-container">
                      <img
                        alt={`Foto de ${skater.name}`}
                        className="w-full h-full object-cover"
                        src={skater.imageUrl}
                        onError={(event) => {
                          event.currentTarget.src = "/default-avatar.svg";
                        }}
                      />
                      <span className="absolute top-space-sm right-space-sm px-2 py-0.5 bg-on-surface/90 text-on-primary rounded-full font-label-sm text-label-sm uppercase tracking-wide backdrop-blur-sm">
                        {skater.badgeTop}
                      </span>
                      <span className="absolute bottom-space-sm left-space-sm px-2 py-0.5 bg-surface-container-lowest text-on-surface font-label-sm text-label-sm rounded-md shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[14px]">
                          location_on
                        </span>
                        {skater.city}
                      </span>
                    </div>

                    <div className="p-space-md flex flex-col gap-space-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                            {skater.name}
                          </h3>
                          <p className="font-body-sm text-body-sm text-secondary">
                            {skater.experienceLabel}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-headline-md text-headline-md font-bold text-primary">
                            {skater.priceFormatted}
                          </div>
                          <span className="font-label-sm text-label-sm text-secondary uppercase">
                            COP / sesión
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-space-xs">
                        {skater.modalities.map((mod, idx) => (
                          <span
                            key={mod}
                            className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                              idx === 0
                                ? "bg-primary-fixed text-on-primary-fixed"
                                : "bg-surface-container text-on-secondary-fixed-variant"
                            }`}
                          >
                            {mod}
                          </span>
                        ))}
                        <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-container text-on-secondary-fixed">
                          {skater.level}
                        </span>
                      </div>

                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-space-xs">
                        {skater.bio}
                      </p>
                    </div>
                  </div>

                  <div className="p-space-md pt-0 flex flex-col gap-2">
                    <a
                      className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-label-md text-label-md py-2.5 rounded-lg flex items-center justify-center gap-space-xs transition-colors shadow-sm"
                      href={skater.whatsappUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                      </svg>
                      <span>Contactar por WhatsApp</span>
                    </a>
                    {skater.id < 1000 ? (
                      <Link
                        className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md py-2 rounded-lg transition-colors text-center"
                        href={`/skater/${skater.id}`}
                      >
                        Ver Perfil Completo
                      </Link>
                    ) : (
                      <>
                        <Link
                          className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md py-2 rounded-lg transition-colors text-center"
                          href={`/skater/preview/?id=${skater.id}`}
                        >
                          Ver Perfil Completo
                        </Link>
                        {isAdmin && (
                          <button
                            className="w-full inline-flex items-center justify-center gap-space-xs border border-error/30 bg-error-container/70 text-on-error-container hover:bg-error-container hover:border-error/50 font-label-md text-label-md py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                            type="button"
                            onClick={() => setSkaterToDelete(skater)}
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              delete
                            </span>
                            Eliminar skater
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-space-xl bg-surface-container-lowest rounded-xl shadow-sm text-center">
              <span className="material-symbols-outlined text-secondary text-[48px] mb-2">
                search_off
              </span>
              <h4 className="font-headline-md text-headline-md text-on-surface">
                No encontramos skaters con esos filtros
              </h4>
              <p className="font-body-sm text-body-sm text-secondary mt-1 max-w-sm">
                Prueba ajustando la modalidad o limpiando la búsqueda para ver más instructores disponibles.
              </p>
              <button
                className="mt-space-md px-space-md py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md cursor-pointer"
                type="button"
                onClick={resetFilters}
              >
                Restablecer filtros
              </button>
            </div>
          )}
            </>
          ) : (
            <div className="flex flex-col items-center text-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
              <span className="material-symbols-outlined text-primary text-[40px]">
                lock
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Inicia sesión para explorar el catálogo
              </h2>
              <p className="max-w-xl font-body-md text-body-md text-secondary">
                La portada de SkateMentor es pública. Para ver perfiles y datos
                de contacto, inicia sesión o crea una cuenta de estudiante.
              </p>
              <Link
                className="mt-space-sm inline-flex items-center gap-space-xs rounded-lg bg-primary px-space-lg py-3 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
                href="/login?next=%2F%23skatersGrid"
              >
                Iniciar sesión o crear cuenta
                <span className="material-symbols-outlined text-[18px]">
                  login
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="w-full bg-surface-container-low py-space-xl" id="como-funciona">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter flex flex-col gap-space-lg">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase">
              Proceso Transparente
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              ¿Cómo funciona SkateMentor?
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              Sin registros burocráticos ni comisiones ocultas. De tu pantalla al asfalto en 3 simples pasos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary font-headline-md text-headline-md font-bold">
                1
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Elige tu instructor
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                Explora perfiles detallados, fotos de spots, especialidades (Street, Bowl o Grind) y tarifas por sesión según tu ciudad.
              </p>
              <div className="mt-auto pt-space-xs flex items-center gap-1 text-primary font-label-sm text-label-sm">
                <span>Filtros instantáneos</span>
                <span className="material-symbols-outlined text-[16px]">tune</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed font-headline-md text-headline-md font-bold">
                2
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Escríbele a WhatsApp
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                Un clic te abrirá el chat con un mensaje pre-cargado. Consulta disponibilidad de horarios y resuelve dudas previas.
              </p>
              <div className="mt-auto pt-space-xs flex items-center gap-1 text-tertiary font-label-sm text-label-sm">
                <span>Conversación directa</span>
                <span className="material-symbols-outlined text-[16px]">chat</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed font-headline-md text-headline-md font-bold">
                3
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Punto de encuentro
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                Fijen el skatepark o spot urbano público más cercano a ti, lleva tu tabla y equipo de seguridad, ¡y a rodar!
              </p>
              <div className="mt-auto pt-space-xs flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                <span>Sesión 1 a 1</span>
                <span className="material-symbols-outlined text-[16px]">
                  skateboarding
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER FOR PRO SKATERS */}
      <section className="w-full py-space-xl">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter">
          <div className="bg-on-surface text-on-primary rounded-xl p-space-lg md:p-space-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-space-lg relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col gap-space-xs max-w-lg z-10 text-center md:text-left">
              <span className="font-label-sm text-label-sm text-primary-fixed font-bold tracking-widest uppercase">
                Comunidad de Instructores
              </span>
              <h3 className="font-headline-lg text-headline-lg font-bold leading-tight">
                ¿Eres skater pro o con trayectoria?
              </h3>
              <p className="font-body-md text-body-md text-surface-container-highest">
                Monetiza tu pasión enseñando a nuevas generaciones en Barranquilla, Bogotá o Medellín. Únete al catálogo sin cobro de inscripción.
              </p>
            </div>
            <div className="z-10 flex flex-col sm:flex-row items-center gap-space-sm w-full md:w-auto shrink-0">
              <Link
                className="w-full sm:w-auto px-space-lg py-3 bg-primary hover:bg-primary-container text-on-primary font-headline-md text-[16px] font-bold rounded-lg transition-all shadow-md text-center"
                href="/login?next=/nuevo-skater"
              >
                ¿Eres skater pro? Inicia sesión para registrarte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {skaterToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm px-gutter-mobile"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-skater-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSkaterToDelete(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-2xl border border-outline-variant">
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 shrink-0 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
                <span className="material-symbols-outlined">delete_forever</span>
              </div>
              <div>
                <h3
                  id="delete-skater-title"
                  className="font-headline-md text-headline-md text-on-surface font-bold"
                >
                  ¿Eliminar a {skaterToDelete.name}?
                </h3>
                <p className="font-body-sm text-body-sm text-secondary mt-1">
                  Esta acción quitará el perfil del catálogo de este navegador.
                </p>
              </div>
            </div>
            <div className="mt-space-lg flex flex-col-reverse sm:flex-row sm:justify-end gap-space-sm">
              <button
                className="px-space-md py-2.5 rounded-xl border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
                type="button"
                onClick={() => setSkaterToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-error text-on-error hover:opacity-90 font-label-md text-label-md transition-opacity cursor-pointer"
                type="button"
                onClick={() => deleteRegisteredSkater(skaterToDelete)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  delete
                </span>
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}