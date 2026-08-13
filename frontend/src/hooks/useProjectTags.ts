import { useState, useCallback } from "react";

export interface ProjectTag {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

const DEFAULT_TAGS: ProjectTag[] = [
  { id: "tag-core", project_id: "default", name: "Core", color: "#0284c7", created_at: new Date().toISOString() },
  { id: "tag-frontend", project_id: "default", name: "Frontend", color: "#ec4899", created_at: new Date().toISOString() },
  { id: "tag-backend", project_id: "default", name: "Backend", color: "#22c55e", created_at: new Date().toISOString() },
  { id: "tag-database", project_id: "default", name: "Database", color: "#eab308", created_at: new Date().toISOString() },
  { id: "tag-security", project_id: "default", name: "Security", color: "#ef4444", created_at: new Date().toISOString() },
  { id: "tag-devops", project_id: "default", name: "DevOps", color: "#8b5cf6", created_at: new Date().toISOString() },
  { id: "tag-uiux", project_id: "default", name: "UI/UX", color: "#f97316", created_at: new Date().toISOString() },
  { id: "tag-api", project_id: "default", name: "API", color: "#06b6d4", created_at: new Date().toISOString() },
  { id: "tag-testing", project_id: "default", name: "Testing", color: "#10b981", created_at: new Date().toISOString() },
  { id: "tag-bugfix", project_id: "default", name: "Bugfix", color: "#dc2626", created_at: new Date().toISOString() },
  { id: "tag-refactor", project_id: "default", name: "Refactor", color: "#6366f1", created_at: new Date().toISOString() },
  { id: "tag-docs", project_id: "default", name: "Docs", color: "#64748b", created_at: new Date().toISOString() },
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
