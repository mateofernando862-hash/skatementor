"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SKATERS,
  type SkaterProfile,
  type StudentReview,
} from "../../data/skaters";
import {
  isAdminEmail,
  isValidAccountEmail,
  VALID_ACCOUNTS,
} from "../../../lib/auth";
import { getLocalVideo } from "../../../lib/local-media";

const REGISTERED_SKATERS_KEY = "skatementor_registered_skaters";
const ADMIN_REVIEWS_KEY = "skatementor_admin_reviews";
const ADMIN_VERIFICATIONS_KEY = "skatementor_admin_verifications";
const STUDENT_REVIEWS_KEY = "skatementor_student_reviews";

export default function SkaterProfilePage({
  id,
  returnPath,
}: {
  id: string;
  returnPath?: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [adminRating, setAdminRating] = useState(5);
  const [adminReviews, setAdminReviews] = useState<StudentReview[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentComment, setStudentComment] = useState("");
  const [studentRating, setStudentRating] = useState(5);
  const [studentReviews, setStudentReviews] = useState<StudentReview[]>([]);
  const [localVideoUrl, setLocalVideoUrl] = useState("");
  const [isProfileChecked, setIsProfileChecked] = useState(false);

  const skaterId = Number(id);
  const loginUrl = `/login?next=${encodeURIComponent(
    returnPath || `/skater/${skaterId}/`
  )}`;
  const [skater, setSkater] = useState<SkaterProfile | undefined>();

  useEffect(() => {
    if (!isAuthenticated) return;

    const defaultSkater = SKATERS.find((item) => item.id === skaterId);
    if (defaultSkater) {
      setSkater(defaultSkater);
      setIsProfileChecked(true);
      return;
    }

    try {
      const stored = localStorage.getItem(REGISTERED_SKATERS_KEY);
      const registered = stored
        ? (JSON.parse(stored) as SkaterProfile[])
        : [];
      setSkater(
        registered.find((item) => item.id === skaterId)
      );
      setIsProfileChecked(true);
    } catch {
      setSkater(undefined);
      setIsProfileChecked(true);
    }
  }, [isAuthenticated, skaterId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let activeUrl = "";
    if (skaterId >= 1000) {
      getLocalVideo(`skater-${skaterId}`)
        .then((video) => {
          if (!video) return;
          activeUrl = URL.createObjectURL(video);
          setLocalVideoUrl(activeUrl);
        })
        .catch(() => setLocalVideoUrl(""));
    }

    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [isAuthenticated, skaterId]);

  useEffect(() => {
    const session = document.cookie
      .split("; ")
      .find((item) => item.startsWith("skatementor_session="))
      ?.split("=")[1];

    if (!session) {
      setIsAdmin(false);
      setIsAuthenticated(false);
      setIsAuthChecked(true);
      router.replace(loginUrl);
      return;
    }

    try {
      const email = decodeURIComponent(session);
      const authenticated = isValidAccountEmail(email);
      setIsAuthenticated(authenticated);
      const account = VALID_ACCOUNTS.find(
        (item) => item.email.toLowerCase() === email.trim().toLowerCase()
      );
      setIsAdmin(isAdminEmail(email));
      setIsAuthChecked(true);
      if (!authenticated) {
        router.replace(loginUrl);
        return;
      }
      setAdminName(
        account?.email === "vidal@skatementor.com"
          ? "Vidal Niebles"
          : account?.email === "mateo@skatementor.com"
            ? "Mateo Pérez"
            : "Administrador"
      );
    } catch {
      setIsAdmin(false);
      setIsAuthenticated(false);
      setIsAuthChecked(true);
      router.replace(loginUrl);
      return;
    }

    try {
      const reviewsRaw = localStorage.getItem(ADMIN_REVIEWS_KEY);
      const reviews = reviewsRaw
        ? (JSON.parse(reviewsRaw) as Record<string, StudentReview[]>)
        : {};
      setAdminReviews(reviews[String(skaterId)] || []);

      const studentReviewsRaw = localStorage.getItem(STUDENT_REVIEWS_KEY);
      const studentReviewsByProfile = studentReviewsRaw
        ? (JSON.parse(studentReviewsRaw) as Record<string, StudentReview[]>)
        : {};
      setStudentReviews(
        studentReviewsByProfile[String(skaterId)] || []
      );

      const verificationsRaw = localStorage.getItem(ADMIN_VERIFICATIONS_KEY);
      const verifications = verificationsRaw
        ? (JSON.parse(verificationsRaw) as number[])
        : [];
      setIsVerified(verifications.includes(skaterId));
    } catch {
      setAdminReviews([]);
      setIsVerified(false);
    }
  }, [loginUrl, router, skaterId]);

  if (!isAuthChecked || !isAuthenticated || !isProfileChecked) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center font-body-md text-secondary">
        Verificando acceso...
      </div>
    );
  }

  if (!skater) {
    return (
      <div className="max-w-4xl mx-auto px-gutter-mobile md:px-gutter py-space-xl text-center flex flex-col items-center gap-space-md">
        <span className="material-symbols-outlined text-primary text-[48px]">
          person_off
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Perfil de skater no encontrado
        </h1>
        <p className="font-body-md text-body-md text-secondary">
          El instructor que buscas no existe o aún no ha sido publicado en el directorio.
        </p>
        <Link
          className="inline-flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-space-lg py-2.5 rounded-lg transition-colors"
          href="/"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          <span>Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const verifySkater = () => {
    try {
      const raw = localStorage.getItem(ADMIN_VERIFICATIONS_KEY);
      const verifications = raw
        ? (JSON.parse(raw) as number[])
        : [];
      const updated = [...new Set([...verifications, skaterId])];
      localStorage.setItem(
        ADMIN_VERIFICATIONS_KEY,
        JSON.stringify(updated)
      );
      setIsVerified(true);
    } catch {
      window.alert("No se pudo guardar la verificación.");
    }
  };

  const publishAdminReview = () => {
    const comment = adminComment.trim();
    if (!comment) return;

    const review: StudentReview = {
      studentName: adminName,
      subtitle: "Administrador verificado · SkateMentor",
      avatarUrl: "/default-avatar.svg",
      comment,
      achievement: "Perfil revisado por el equipo",
      fullWidth: true,
      rating: adminRating,
    };

    try {
      const raw = localStorage.getItem(ADMIN_REVIEWS_KEY);
      const reviews = raw
        ? (JSON.parse(raw) as Record<string, StudentReview[]>)
        : {};
      const profileReviews = reviews[String(skaterId)] || [];
      const updated = {
        ...reviews,
        [String(skaterId)]: [...profileReviews, review],
      };
      localStorage.setItem(ADMIN_REVIEWS_KEY, JSON.stringify(updated));
      setAdminReviews(updated[String(skaterId)]);
      setAdminComment("");
    } catch {
      window.alert("No se pudo guardar la reseña.");
    }
  };

  const publishStudentReview = () => {
    const comment = studentComment.trim();
    if (!comment) return;

    const review: StudentReview = {
      studentName: studentName.trim() || "Alumno de SkateMentor",
      subtitle: "Alumno registrado",
      avatarUrl: "/default-avatar.svg",
      comment,
      achievement: "Sesión compartida con la comunidad",
      fullWidth: false,
      rating: studentRating,
    };

    try {
      const raw = localStorage.getItem(STUDENT_REVIEWS_KEY);
      const reviews = raw
        ? (JSON.parse(raw) as Record<string, StudentReview[]>)
        : {};
      const profileReviews = reviews[String(skaterId)] || [];
      const updated = {
        ...reviews,
        [String(skaterId)]: [...profileReviews, review],
      };
      localStorage.setItem(STUDENT_REVIEWS_KEY, JSON.stringify(updated));
      setStudentReviews(updated[String(skaterId)]);
      setStudentComment("");
    } catch {
      window.alert("No se pudo guardar la reseña.");
    }
  };

  const combinedReviews = [
    ...skater.reviews,
    ...adminReviews,
    ...studentReviews,
  ];

  return (
    <div className="flex flex-col w-full pb-16 md:pb-0">
      {/* Dynamic Breadcrumb & Quick Actions Bar */}
      <section className="w-full bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter py-space-sm flex flex-wrap items-center justify-between gap-space-sm">
          <nav
            aria-label="Ruta de navegación"
            className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm"
          >
            <Link
              className="hover:text-primary transition-colors flex items-center gap-1"
              href="/"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span>Inicio</span>
            </Link>
            <span className="material-symbols-outlined text-[14px] text-outline-variant">
              chevron_right
            </span>
            <Link className="hover:text-primary transition-colors" href="/">
              Catálogo
            </Link>
            <span className="material-symbols-outlined text-[14px] text-outline-variant">
              chevron_right
            </span>
            <span className="text-on-surface font-semibold truncate max-w-[160px] md:max-w-none">
              {skater.name}
            </span>
          </nav>

          <Link
            className="inline-flex items-center gap-space-xs text-primary hover:text-primary-container font-label-md text-label-md px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
            href="/"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            <span>Volver al Catálogo</span>
          </Link>
        </div>
      </section>

      {/* Hero Profile Section */}
      <section className="w-full bg-surface-container-low py-space-md md:py-space-lg relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col md:flex-row gap-space-lg items-start md:items-center justify-between">
            {/* Left: Avatar + Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md w-full md:w-auto">
              <div className="relative shrink-0">
                <img
                  alt={`Retrato de ${skater.name}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shadow-md"
                  src={skater.imageUrl}
                  onError={(event) => {
                    event.currentTarget.src = "/default-avatar.svg";
                  }}
                />
                <span
                  className="absolute -bottom-2 -right-2 bg-tertiary text-on-tertiary p-1 rounded-full shadow-sm flex items-center justify-center"
                  title="Identidad Verificada"
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {isVerified ? "Skater verificado por el equipo" : skater.verifiedLabel}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      location_on
                    </span>
                    {skater.countryCity}
                  </span>
                </div>

                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-0.5">
                  {skater.name}
                </h1>
                <p className="font-body-md text-body-md text-secondary font-medium">
                  {skater.headline}
                </p>

                {/* Social proof metrics */}
                <div className="flex flex-wrap items-center gap-space-md mt-1.5 pt-1.5 border-t border-surface-container text-on-surface">
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-[18px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-label-md text-label-md font-bold">
                      {skater.rating}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      ({skater.reviewsCount} reseñas de alumnos)
                    </span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      history_edu
                    </span>
                    <span>
                      <strong>{skater.experienceYearsText}</strong> de experiencia
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Pricing & Conversions */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between w-full md:w-auto gap-space-md bg-surface-container p-space-md rounded-xl md:bg-transparent md:p-0">
              <div className="text-left md:text-right">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">
                  Tarifa por Sesión
                </span>
                <div className="flex items-baseline gap-1 md:justify-end">
                  <span className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                    {skater.priceFormatted}
                  </span>
                  <span className="font-body-sm text-body-sm font-medium text-secondary">
                    COP / sesión
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-tertiary flex items-center gap-0.5 md:justify-end">
                  <span className="material-symbols-outlined text-[14px]">
                    flash_on
                  </span>
                  {skater.responseTime}
                </span>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="relative group">
                  <a
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-md text-label-md px-space-md py-space-sm rounded-lg shadow-sm transition-all duration-200 transform hover:-translate-y-0.5"
                    href={skater.whatsappUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 2C6.51 2 2.016 6.494 2.016 12.015c0 1.944.557 3.76 1.521 5.303L2 22l4.827-1.503a9.96 9.96 0 005.204 1.518h.004c5.521 0 10.015-4.494 10.015-10.015S17.552 2 12.031 2zm0 18.291c-1.637 0-3.239-.441-4.634-1.272l-.332-.198-3.447 1.074 1.096-3.361-.217-.346a8.272 8.272 0 01-1.267-4.173c0-4.57 3.719-8.289 8.289-8.289 4.571 0 8.29 3.719 8.29 8.289 0 4.57-3.719 8.29-8.289 8.29zm4.542-6.208c-.249-.125-1.472-.727-1.7-.81-.229-.083-.395-.125-.561.125s-.644.81-.789.977c-.146.166-.291.187-.54.062-.25-.125-1.055-.389-2.01-1.241-.743-.663-1.245-1.482-1.391-1.731-.146-.25-.015-.385.11-.509.112-.112.25-.291.374-.437.125-.146.166-.25.249-.416.083-.166.042-.312-.021-.437-.062-.125-.561-1.352-.769-1.851-.202-.487-.408-.42-.561-.428l-.478-.008c-.166 0-.437.062-.665.312-.229.25-.873.853-.873 2.08s.894 2.413 1.019 2.58c.125.166 1.76 2.688 4.264 3.769.596.257 1.061.411 1.424.526.598.19 1.143.163 1.573.099.48-.072 1.472-.602 1.68-1.185.208-.582.208-1.081.146-1.185-.063-.104-.229-.166-.478-.291z" />
                    </svg>
                    <span>Contactar por WhatsApp</span>
                  </a>
                  <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-body-sm text-[12px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                    Abre chat directo con mensaje preconfigurado
                  </div>
                </div>

                <button
                  className="inline-flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors cursor-pointer"
                  type="button"
                  onClick={handleShare}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copied ? "check" : "share"}
                  </span>
                  <span>{copied ? "¡Enlace copiado!" : "Compartir perfil"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Main Content Layout */}
      <section className="w-full py-space-lg">
        <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Primary Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg min-w-0">
            {/* Sobre mí & Metodología */}
            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center gap-space-xs text-primary mb-space-sm">
                <span className="material-symbols-outlined text-[20px]">school</span>
                <span className="font-label-md text-label-md uppercase tracking-wider font-bold">
                  Filosofía &amp; Enfoque
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-space-sm">
                Sobre mí y metodología de enseñanza
              </h2>
              <div className="space-y-space-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {skater.aboutParagraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-space-sm mt-space-md pt-space-md border-t border-surface-container text-center">
                <div className="p-space-sm rounded-lg bg-surface-container-low">
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {skater.metrics.hours}
                  </span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">
                    Horas impartidas
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low">
                  <span className="font-headline-md text-headline-md text-tertiary font-bold">
                    {skater.metrics.successValue}
                  </span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">
                    {skater.metrics.successLabel}
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low">
                  <span className="font-headline-md text-headline-md text-secondary font-bold">
                    {skater.metrics.injuries}
                  </span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">
                    Lesiones graves
                  </span>
                </div>
              </div>
            </article>

            {/* Trucos y Habilidades Categorizadas */}
            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between mb-space-sm">
                <div>
                  <div className="flex items-center gap-space-xs text-primary mb-1">
                    <span className="material-symbols-outlined text-[20px]">
                      skateboarding
                    </span>
                    <span className="font-label-md text-label-md uppercase tracking-wider font-bold">
                      Plan de Trucos
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Trucos y habilidades que enseña
                  </h2>
                </div>
                <span className="hidden sm:inline-block font-label-sm text-label-sm text-secondary bg-surface-container px-2.5 py-1 rounded-full">
                  Progresión personalizada
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Desglosados por nivel y modalidad urbana. Todos se adaptan a tu ritmo y nivel de coordinación motriz:
              </p>

              <div className="flex flex-col gap-space-md">
                {skater.tricks.map((category) => (
                  <div key={category.title}>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block mb-2">
                      {category.title}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((trick, i) => {
                        const isPrimaryBadge = category.highlighted && i < 2;
                        const isHighBadge = category.icon === "architecture";
                        return (
                          <span
                            key={trick}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md cursor-default ${
                              isPrimaryBadge
                                ? "bg-primary-fixed text-on-primary-fixed-variant shadow-xs"
                                : isHighBadge
                                ? "bg-surface-container-high text-on-surface"
                                : "bg-surface-container text-on-surface"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {category.icon}
                            </span>
                            {trick}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Galería de Spots y Fotos en Acción */}
            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between mb-space-sm">
                <div>
                  <div className="flex items-center gap-space-xs text-primary mb-1">
                    <span className="material-symbols-outlined text-[20px]">
                      photo_camera
                    </span>
                    <span className="font-label-md text-label-md uppercase tracking-wider font-bold">
                      En Acción
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Galería de fotos y videos en spots
                  </h2>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {skater.galleryCityLabel}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                {skater.galleryDescription}
              </p>

              {(localVideoUrl || skater.socialVideoUrl) && (
                <div className="mb-space-md">
                  {localVideoUrl ? (
                    <video
                      className="w-full max-h-[420px] rounded-xl bg-inverse-surface object-contain"
                      controls
                      preload="metadata"
                      src={localVideoUrl}
                    />
                  ) : (
                    <a
                      href={skater.socialVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-space-xs min-h-40 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-headline-md text-headline-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-[32px]">
                        smart_display
                      </span>
                      Ver video de trucos
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-sm">
                {skater.gallery.map((photo, index) => (
                  <div
                    key={index}
                    className={`${
                      photo.wide ? "sm:col-span-2" : ""
                    } relative group overflow-hidden rounded-xl h-52 bg-surface-container`}
                  >
                    <img
                      alt={photo.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      src={photo.imageUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-transparent to-transparent flex items-end p-space-sm">
                      <div>
                        {photo.tag && (
                          <span
                            className={`font-label-sm text-label-sm uppercase px-2 py-0.5 rounded ${
                              photo.tagColor === "tertiary"
                                ? "bg-tertiary text-on-tertiary"
                                : photo.tagColor === "secondary"
                                ? "bg-secondary text-on-secondary"
                                : "bg-primary text-on-primary"
                            }`}
                          >
                            {photo.tag}
                          </span>
                        )}
                        <p className="font-body-sm text-body-sm font-semibold text-inverse-on-surface mt-1">
                          {photo.caption}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Opiniones de Aprendices */}
            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <div className="flex items-center gap-space-xs text-primary mb-1">
                    <span className="material-symbols-outlined text-[20px]">
                      rate_review
                    </span>
                    <span className="font-label-md text-label-md uppercase tracking-wider font-bold">
                      Feedback de Estudiantes
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Opiniones de aprendices
                  </h2>
                </div>
                <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-lg text-on-surface">
                  <span
                    className="material-symbols-outlined text-[18px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-label-md text-label-md font-bold">
                    {skater.rating} de 5
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div className="mb-space-md rounded-xl border border-primary-fixed bg-surface-container-low p-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm">
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">
                        Revisión del administrador
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary">
                        Publica como {adminName}.
                      </p>
                    </div>
                    {!isVerified && (
                      <button
                        type="button"
                        onClick={verifySkater}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-tertiary-container text-on-tertiary-container px-space-md py-2 font-label-md text-label-md cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          verified
                        </span>
                        Verificar skater
                      </button>
                    )}
                  </div>

                  <div className="mt-space-sm grid grid-cols-1 md:grid-cols-[160px_1fr] gap-space-sm">
                    <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface">
                      Calificación
                      <select
                        value={adminRating}
                        onChange={(event) =>
                          setAdminRating(Number(event.target.value))
                        }
                        className="rounded-lg bg-surface-container-lowest px-3 py-2 font-body-md text-body-md"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} estrella{rating !== 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface">
                      Comentario
                      <div className="flex flex-col sm:flex-row gap-space-xs">
                        <textarea
                          value={adminComment}
                          onChange={(event) =>
                            setAdminComment(event.target.value)
                          }
                          maxLength={450}
                          rows={2}
                          placeholder="Escribe la reseña del equipo..."
                          className="min-h-10 flex-1 resize-none rounded-lg bg-surface-container-lowest px-3 py-2 font-body-md text-body-md"
                        />
                        <button
                          type="button"
                          disabled={!adminComment.trim()}
                          onClick={publishAdminReview}
                          className="rounded-lg bg-primary px-space-md py-2 text-on-primary font-label-md text-label-md disabled:opacity-50 cursor-pointer"
                        >
                          Publicar reseña
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {isAuthenticated && !isAdmin && (
                <div className="mb-space-md rounded-xl border border-secondary-container bg-surface-container-low p-space-md">
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    Comparte tu experiencia
                  </p>
                  <p className="font-body-sm text-body-sm text-secondary mt-1">
                    Solo las cuentas registradas pueden publicar reseñas.
                  </p>
                  <div className="mt-space-sm grid grid-cols-1 md:grid-cols-[160px_1fr] gap-space-sm">
                    <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface">
                      Calificación
                      <select
                        value={studentRating}
                        onChange={(event) =>
                          setStudentRating(Number(event.target.value))
                        }
                        className="rounded-lg bg-surface-container-lowest px-3 py-2 font-body-md text-body-md"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} estrella{rating !== 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-1 gap-space-xs">
                      <input
                        value={studentName}
                        onChange={(event) => setStudentName(event.target.value)}
                        placeholder="Tu nombre"
                        className="rounded-lg bg-surface-container-lowest px-3 py-2 font-body-md text-body-md"
                      />
                      <div className="flex flex-col sm:flex-row gap-space-xs">
                        <textarea
                          value={studentComment}
                          onChange={(event) =>
                            setStudentComment(event.target.value)
                          }
                          maxLength={450}
                          rows={2}
                          placeholder="Cuenta tu experiencia con el skater..."
                          className="min-h-10 flex-1 resize-none rounded-lg bg-surface-container-lowest px-3 py-2 font-body-md text-body-md"
                        />
                        <button
                          type="button"
                          disabled={!studentComment.trim()}
                          onClick={publishStudentReview}
                          className="rounded-lg bg-primary px-space-md py-2 text-on-primary font-label-md text-label-md disabled:opacity-50 cursor-pointer"
                        >
                          Publicar reseña
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {combinedReviews.map((review) => (
                  <div
                    key={`${review.studentName}-${review.comment}`}
                    className={`p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between ${
                      review.fullWidth ? "md:col-span-2" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <img
                            alt={review.studentName}
                            className="w-10 h-10 rounded-full object-cover"
                            src={review.avatarUrl}
                            onError={(event) => {
                              event.currentTarget.src = "/default-avatar.svg";
                            }}
                          />
                          <div>
                            <h3 className="font-label-md text-label-md font-bold text-on-surface">
                              {review.studentName}
                            </h3>
                            <span className="font-body-sm text-[12px] text-on-surface-variant">
                              {review.subtitle}
                            </span>
                          </div>
                        </div>
                        <div className="flex text-primary">
                          {[...Array(5)].map((_, sIdx) => (
                            <span
                              key={sIdx}
                              className={`material-symbols-outlined text-[16px] ${
                                sIdx < (review.rating || 5)
                                  ? "text-primary"
                                  : "text-outline-variant"
                              }`}
                              style={{
                                fontVariationSettings:
                                  sIdx < (review.rating || 5)
                                    ? "'FILL' 1"
                                    : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant italic mt-2">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    </div>
                    <div className="mt-space-sm pt-2 border-t border-surface-container flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary font-bold">
                        Logro alcanzado:
                      </span>
                      <span className="font-body-sm text-[12px] text-secondary font-medium">
                        {review.achievement}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* Sidebar Column (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-space-lg w-full">
            {/* Tarjeta 1: Resumen de Clases */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-center gap-space-xs text-primary mb-space-sm">
                <span className="material-symbols-outlined text-[20px]">
                  event_available
                </span>
                <h3 className="font-label-md text-label-md uppercase tracking-wider font-bold">
                  Resumen de Clases
                </h3>
              </div>

              <ul className="flex flex-col gap-space-sm">
                <li className="flex items-start gap-space-sm pb-space-sm border-b border-surface-container">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                    trending_up
                  </span>
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface block">
                      Nivel recomendado
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {skater.recommendedLevels}
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-space-sm pb-space-sm border-b border-surface-container">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                    timer
                  </span>
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface block">
                      Duración de sesión
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {skater.sessionDuration}
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-space-sm pb-space-sm border-b border-surface-container">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                    backpack
                  </span>
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface block">
                      Qué debes traer
                    </span>
                    <ul className="font-body-sm text-body-sm text-on-surface-variant list-disc list-inside space-y-0.5 mt-0.5">
                      <li>Tabla de skate en estado funcional</li>
                      <li>Calzado de suela plana (tipo Vans o Converse)</li>
                      <li>Casco y rodilleras (muy recomendados)</li>
                      <li>Hidratación (termo de agua fría)</li>
                    </ul>
                  </div>
                </li>

                <li className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                    group
                  </span>
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface block">
                      Modalidad
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {skater.sessionMode}
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-space-md">
                <a
                  className="w-full inline-flex items-center justify-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-space-sm rounded-lg shadow-sm transition-colors text-center"
                  href={skater.whatsappScheduleUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_month
                  </span>
                  <span>Consultar Horarios Libres</span>
                </a>
              </div>
            </div>

            {/* Tarjeta 2: Spots Habituales */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-center gap-space-xs text-primary mb-space-sm">
                <span className="material-symbols-outlined text-[20px]">
                  pin_drop
                </span>
                <h3 className="font-label-md text-label-md uppercase tracking-wider font-bold">
                  Spots Habituales
                </h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                {skater.spotsIntro}
              </p>

              <a
                className="block w-full h-44 rounded-lg bg-cover bg-center mb-space-md relative overflow-hidden shadow-xs"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  skater.mapLocationQuery
                )}`}
                rel="noopener noreferrer"
                style={{ backgroundImage: `url('${skater.mapPreviewUrl}')` }}
                target="_blank"
              >
                <div className="absolute inset-0 bg-on-background/20 hover:bg-on-background/10 transition-colors flex items-center justify-center">
                  <span className="bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[14px]">
                      map
                    </span>
                    Ver en Google Maps
                  </span>
                </div>
              </a>

              <div className="space-y-space-sm font-body-sm text-body-sm">
                {skater.spots.map((spot) => (
                  <div
                    key={spot.name}
                    className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {spot.name}
                      </span>
                      <span
                        className={`font-label-sm text-[11px] font-bold bg-surface-container px-2 py-0.5 rounded ${
                          spot.badgeColor === "tertiary"
                            ? "text-tertiary"
                            : spot.badgeColor === "secondary"
                            ? "text-secondary"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {spot.badge}
                      </span>
                    </div>
                    <span className="text-on-surface-variant text-[12px]">
                      {spot.address}
                    </span>
                    <span className="text-secondary text-[12px] font-medium">
                      {spot.schedule}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta 3: Garantía SkateMentor */}
            <div className="bg-surface-container rounded-xl p-space-md shadow-sm border border-transparent">
              <div className="flex items-center gap-space-xs text-primary mb-2">
                <span className="material-symbols-outlined text-[20px]">
                  verified_user
                </span>
                <h3 className="font-label-md text-label-md uppercase tracking-wider font-bold">
                  Garantía SkateMentor
                </h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface mb-space-sm leading-relaxed">
                Plataforma desarrollada por la comunidad universitaria{" "}
                <strong>CUC Barranquilla</strong>.
              </p>
              <ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">
                    check
                  </span>
                  <span>
                    <strong>0% Comisiones:</strong> Pagas directo al mentor en efectivo o Nequi.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">
                    check
                  </span>
                  <span>
                    <strong>Identidad Validada:</strong> Antecedentes y trayectoria verificados.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">
                    check
                  </span>
                  <span>
                    <strong>Soporte Comunitario:</strong> Spots públicos y seguros con acceso libre.
                  </span>
                </li>
              </ul>
              <div className="mt-space-md pt-space-sm border-t border-surface-container-high flex items-center justify-between text-on-surface-variant font-body-sm text-[12px]">
                <span>ID Mentor: {skater.mentorCode}</span>
                <Link className="text-primary hover:underline font-semibold" href="/">
                  Ver otros mentores
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Sticky Mobile Direct WhatsApp Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-surface/95 backdrop-blur-md p-space-sm shadow-xl flex items-center justify-between gap-space-sm border-t border-surface-container-high">
        <div className="flex flex-col">
          <span className="font-body-sm text-[12px] text-on-surface-variant">
            {skater.name} · {skater.priceFormatted} COP
          </span>
          <span className="font-label-md text-label-md font-bold text-tertiary">
            Disponible hoy
          </span>
        </div>
        <a
          className="inline-flex items-center gap-space-xs bg-tertiary-container text-on-tertiary font-label-md text-label-md px-space-md py-space-sm rounded-lg shadow-sm"
          href={skater.whatsappUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}