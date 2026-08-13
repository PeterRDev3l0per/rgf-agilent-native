export interface TagStyle {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const HOMOLOGATED_TAGS: Record<string, { es: string; en: string; color: string; bgColor: string; textColor: string; borderColor: string }> = {
  core: {
    es: "Core",
    en: "Core",
    color: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.15)",
    textColor: "#c084fc",
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  frontend: {
    es: "Frontend",
    en: "Frontend",
    color: "#ec4899",
    bgColor: "rgba(236, 72, 153, 0.15)",
    textColor: "#f472b6",
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  backend: {
    es: "Backend",
    en: "Backend",
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.15)",
    textColor: "#22d3ee",
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  database: {
    es: "Base de Datos",
    en: "Database",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.15)",
    textColor: "#34d399",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  security: {
    es: "Seguridad",
    en: "Security",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
    textColor: "#f87171",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  funcionalidad: {
    es: "Funcionalidad",
    en: "Feature",
    color: "#0284c7",
    bgColor: "rgba(2, 132, 199, 0.15)",
    textColor: "#38bdf8",
    borderColor: "rgba(2, 132, 199, 0.3)",
  },
};

export const getHomologatedTag = (rawName: string, lang: string = "es"): TagStyle => {
  const clean = (rawName || "").replace(/^tag-/, "").trim();
  const lower = clean.toLowerCase();

  let matchedKey = "funcionalidad";
  if (lower === "core" || lower === "núcleo") matchedKey = "core";
  else if (lower === "frontend" || lower === "ui" || lower === "ux") matchedKey = "frontend";
  else if (lower === "backend" || lower === "servidor" || lower === "api") matchedKey = "backend";
  else if (lower === "database" || lower === "bd" || lower === "base de datos") matchedKey = "database";
  else if (lower === "security" || lower === "seguridad") matchedKey = "security";
  else if (lower === "funcionalidad" || lower === "feature") matchedKey = "funcionalidad";

  if (HOMOLOGATED_TAGS[matchedKey]) {
    const config = HOMOLOGATED_TAGS[matchedKey];
    const displayName = lang === "es" ? config.es : config.en;
    return {
      id: matchedKey,
      name: displayName,
      color: config.color,
      bgColor: config.bgColor,
      textColor: config.textColor,
      borderColor: config.borderColor,
    };
  }

  const capitalized = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Tag";
  return {
    id: clean,
    name: capitalized,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.15)",
    textColor: "#60a5fa",
    borderColor: "rgba(59, 130, 246, 0.3)",
  };
};
