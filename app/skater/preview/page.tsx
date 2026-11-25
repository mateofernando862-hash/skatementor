"use client";

import { useEffect, useState } from "react";
import ProfileContent from "../[id]/ProfileContent";

export default function PreviewProfilePage() {
  const [id, setId] = useState("");

  useEffect(() => {
    setId(new URL(window.location.href).searchParams.get("id") || "");
  }, []);

  if (!id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center font-body-md text-secondary">
        Cargando perfil...
      </div>
    );
  }

  return (
    <ProfileContent
      id={id}
      returnPath={`/skater/preview/?id=${encodeURIComponent(id)}`}
    />
  );
}
