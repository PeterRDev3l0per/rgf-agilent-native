import React, { createContext, useContext, useState } from "react";

export type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    "nav.home": "Inicio",
    "nav.chat": "Chat RAG",
    "nav.notifications": "Notificaciones",
    "nav.newTask": "Nueva Tarea",
    "nav.selectProject": "Seleccionar Proyecto",
    "nav.newProject": "Nuevo Proyecto",
    "nav.language": "Idioma",
    "nav.lightMode": "Modo Claro",
    "nav.darkMode": "Modo Oscuro",
    "nav.settings": "Configuración",
    "nav.share": "Compartir",
    "status.backlog": "Backlog",
    "status.todo": "Por Hacer",
    "status.inProgress": "En Proceso",
    "status.inprogress": "En Proceso",
    "status.verification": "Verificación",
    "status.client_approval": "Verificación",
    "status.done": "Completado",
    "priority.low": "Bajo",
    "priority.medium": "Medio",
    "priority.high": "Alto",
    "priority.short.low": "Bajo",
    "priority.short.medium": "Medio",
    "priority.short.high": "Alto",
    "priority.baja": "Bajo",
    "priority.media": "Medio",
    "priority.alta": "Alto",
    "priority.Bajo": "Bajo",
    "priority.Medio": "Medio",
    "priority.Alto": "Alto",
    "priority.Media": "Medio",
    "chat.title": "Asistente Local RAG",
    "chat.subtitle": "Consultá todo sobre el backlog, tareas, especificaciones o código",
    "chat.placeholder": "¿Cuál es el estado de las tareas del proyecto?",
    "chat.send": "Enviar",
    "chat.thinking": "Pensando respuesta...",
    "chat.clear": "Limpiar Chat",
    "settings.languageLabel": "Idioma de Interfaz",
    "settings.spanish": "Español",
    "settings.english": "English",
    "notifications.title": "Notificaciones",
    "notifications.clear": "Borrar todas",
    "notifications.empty": "No hay notificaciones por el momento",
    "project.created": "Proyecto Creado",
    "project.nameLabel": "Nombre del Proyecto",
    "task.created": "Tarea Creada",
    "task.newTask": "Nueva Tarea",
    "task.createTask": "Crear Tarea",
    "task.titleLabel": "Título de la Tarea",
    "task.titlePlaceholder": "Título de la tarea...",
    "task.descriptionLabel": "Descripción",
    "task.descriptionPlaceholder": "Detalles de la tarea...",
    "task.assignee": "Asignado",
    "task.assignees": "Asignados",
    "task.noAssignee": "Sin asignar",
    "task.noDueDate": "Sin fecha de entrega",
    "task.deleteTask": "Eliminar Tarea",
    "task.saveChanges": "Guardar Cambios",
    "task.noDescription": "Sin descripción",
    "task.tags": "Tópico",
    "task.topic": "Tópico",
    "task.topics": "Tópicos",
    "task.clientVisibility": "Visibilidad del cliente",
    "header.welcome": "Hola",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.close": "Cerrar",
    "common.clear": "Borrar",
    "notfound.title": "404 - Página No Encontrada",
    "notfound.desc": "La sección que estás buscando no existe o cambio de ruta.",
    "notfound.button": "Volver al Kanban",
  },
  en: {
    "nav.home": "Home",
    "nav.chat": "Chat RAG",
    "nav.notifications": "Notifications",
    "nav.newTask": "New Task",
    "nav.selectProject": "Select Project",
    "nav.newProject": "New Project",
    "nav.language": "Language",
    "nav.lightMode": "Light Mode",
    "nav.darkMode": "Dark Mode",
    "nav.settings": "Settings",
    "nav.share": "Share",
    "status.backlog": "Backlog",
    "status.todo": "To Do",
    "status.inProgress": "In Progress",
    "status.inprogress": "In Progress",
    "status.verification": "Verification",
    "status.client_approval": "Client Approval",
    "status.done": "Done",
    "priority.low": "Low",
    "priority.medium": "Medium",
    "priority.high": "High",
    "priority.short.low": "Low",
    "priority.short.medium": "Medium",
    "priority.short.high": "High",
    "priority.baja": "Low",
    "priority.media": "Medium",
    "priority.alta": "High",
    "priority.Bajo": "Low",
    "priority.Medio": "Medium",
    "priority.Alto": "High",
    "priority.Media": "Medium",
    "chat.title": "Local RAG Assistant",
    "chat.subtitle": "Ask anything about specs, tasks, or code",
    "chat.placeholder": "What is the current project status?",
    "chat.send": "Send",
    "chat.thinking": "Thinking...",
    "chat.clear": "Clear Chat",
    "settings.languageLabel": "Interface Language",
    "settings.spanish": "Español",
    "settings.english": "English",
    "notifications.title": "Notifications",
    "notifications.clear": "Clear all",
    "notifications.empty": "No notifications yet",
    "project.created": "Project Created",
    "project.nameLabel": "Project Name",
    "task.created": "Task Created",
    "task.newTask": "New Task",
    "task.createTask": "Create Task",
    "task.titleLabel": "Task Title",
    "task.titlePlaceholder": "Task title...",
    "task.descriptionLabel": "Description",
    "task.descriptionPlaceholder": "Task details...",
    "task.assignee": "Assignee",
    "task.assignees": "Assignees",
    "task.noAssignee": "No Assignees",
    "task.noDueDate": "No due date",
    "task.deleteTask": "Delete Task",
    "task.saveChanges": "Save Changes",
    "task.noDescription": "No description",
    "task.tags": "Topic",
    "task.topic": "Topic",
    "task.topics": "Topics",
    "task.clientVisibility": "Client Visibility",
    "header.welcome": "Welcome",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.close": "Close",
    "common.clear": "Clear",
    "notfound.title": "404 - Page Not Found",
    "notfound.desc": "The page you are trying to access does not exist or has moved.",
    "notfound.button": "Return to Kanban",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agilent_language");
      if (saved === "es" || saved === "en") return saved;
    }
    return "es";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("agilent_language", lang);
  };

  const t = (key: string): string => {
    if (!key) return "";
    
    // Direct match in selected language
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Direct match in English fallback
    if (translations["en"] && translations["en"][key]) {
      return translations["en"][key];
    }

    // Case-insensitive & normalized match (handling e.g. "Priority.Media", "priority.media", "task.deleteTask")
    const lowerKey = key.toLowerCase();
    for (const [k, val] of Object.entries(translations[language])) {
      if (k.toLowerCase() === lowerKey) return val;
    }

    // Special cleanups for dot-notated keys
    if (lowerKey === "priority.media" || lowerKey === "priority.medium") {
      return language === "es" ? "Medio (ámbar)" : "Medium (amber)";
    }
    if (lowerKey === "priority.alta" || lowerKey === "priority.alto" || lowerKey === "priority.high") {
      return language === "es" ? "Alto (rojo)" : "High (red)";
    }
    if (lowerKey === "priority.baja" || lowerKey === "priority.bajo" || lowerKey === "priority.low") {
      return language === "es" ? "Bajo (amarillo claro)" : "Low (light yellow)";
    }

    if (lowerKey === "task.deletetask") {
      return language === "es" ? "Eliminar Tarea" : "Delete Task";
    }
    if (lowerKey === "task.noduedate") {
      return language === "es" ? "Sin fecha de entrega" : "No due date";
    }

    const lastPart = key.split(".").pop() || key;
    return lastPart.replace(/([A-Z])/g, " $1").trim();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
