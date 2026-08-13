import { useState, useCallback } from "react";

export interface ProjectTag {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

const DEFAULT_TAGS: ProjectTag[] = [
  { id: "tag-core", project_id: "default", name: "Core", color: "#a855f7", created_at: new Date().toISOString() },
  { id: "tag-frontend", project_id: "default", name: "Frontend", color: "#ec4899", created_at: new Date().toISOString() },
  { id: "tag-backend", project_id: "default", name: "Backend", color: "#06b6d4", created_at: new Date().toISOString() },
  { id: "tag-database", project_id: "default", name: "Database", color: "#10b981", created_at: new Date().toISOString() },
  { id: "tag-security", project_id: "default", name: "Security", color: "#ef4444", created_at: new Date().toISOString() },
  { id: "tag-funcionalidad", project_id: "default", name: "Funcionalidad", color: "#0284c7", created_at: new Date().toISOString() },
  { id: "tag-devops", project_id: "default", name: "DevOps", color: "#8b5cf6", created_at: new Date().toISOString() },
  { id: "tag-testing", project_id: "default", name: "Pruebas", color: "#f59e0b", created_at: new Date().toISOString() },
  { id: "tag-docs", project_id: "default", name: "Documentación", color: "#64748b", created_at: new Date().toISOString() },
];

export const useProjectTags = (projectId: string | null) => {
  const [tags, setTags] = useState<ProjectTag[]>(DEFAULT_TAGS);
  const [loading] = useState(false);

  const fetchTags = useCallback(async () => {
    setTags(DEFAULT_TAGS);
  }, []);

  const createTag = async (name: string, color: string = "#3b82f6"): Promise<ProjectTag | null> => {
    const newTag: ProjectTag = {
      id: `tag-${Date.now()}`,
      project_id: projectId || "default",
      name: name.trim(),
      color,
      created_at: new Date().toISOString(),
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  };

  const updateTagColor = async (tagId: string, color: string) => {
    setTags((prev) => prev.map((t) => (t.id === tagId ? { ...t, color } : t)));
  };

  const deleteTag = async (tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  return {
    tags,
    loading,
    createTag,
    updateTagColor,
    deleteTag,
    refetch: fetchTags,
  };
};
