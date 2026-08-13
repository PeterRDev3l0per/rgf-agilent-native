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
  devops: {
    es: "DevOps",
    en: "DevOps",
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.15)",
    textColor: "#a78bfa",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  testing: {
    es: "Pruebas",
    en: "Testing",
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.15)",
    textColor: "#fbbf24",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  bugfix: {
    es: "Corrección",
    en: "Bugfix",
    color: "#dc2626",
    bgColor: "rgba(220, 38, 38, 0.15)",
    textColor: "#f87171",
    borderColor: "rgba(220, 38, 38, 0.3)",
  },
  docs: {
    es: "Documentación",
    en: "Docs",
    color: "#64748b",
    bgColor: "rgba(100, 116, 139, 0.15)",
    textColor: "#94a3b8",
    borderColor: "rgba(100, 116, 139, 0.3)",
  },
};

export const getHomologatedTag = (rawName: string, lang: string = "es"): TagStyle => {
  const clean = (rawName || "").replace(/^tag-/, "").trim();
  const lower = clean.toLowerCase();

  let matchedKey: string | null = null;
  if (lower === "core" || lower === "núcleo") matchedKey = "core";
  else if (lower === "frontend" || lower === "ui") matchedKey = "frontend";
  else if (lower === "backend" || lower === "servidor") matchedKey = "backend";
  else if (lower === "database" || lower === "bd" || lower === "base de datos") matchedKey = "database";
  else if (lower === "security" || lower === "seguridad") matchedKey = "security";
  else if (lower === "funcionalidad" || lower === "feature") matchedKey = "funcionalidad";
  else if (lower === "devops" || lower === "infra") matchedKey = "devops";
  else if (lower === "testing" || lower === "pruebas" || lower === "test" || lower === "verificación" || lower === "verificacion") matchedKey = "testing";
  else if (lower === "bugfix" || lower === "bug" || lower === "fix" || lower === "corrección" || lower === "correccion") matchedKey = "bugfix";
  else if (lower === "docs" || lower === "documentación" || lower === "documentacion") matchedKey = "docs";
  else if (HOMOLOGATED_TAGS[lower]) matchedKey = lower;

  if (matchedKey && HOMOLOGATED_TAGS[matchedKey]) {
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
    color: "#0284c7",
    bgColor: "rgba(2, 132, 199, 0.15)",
    textColor: "#38bdf8",
    borderColor: "rgba(2, 132, 199, 0.3)",
  };
};
