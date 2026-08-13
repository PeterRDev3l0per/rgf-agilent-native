import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  created_at: string;
}

export const useProjects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        const projList: Project[] = data.projects || [];
        if (projList.length > 0) {
          setProjects(projList);
          const savedId = localStorage.getItem("agilent_active_project_id");
          const matched = projList.find(
            (p) => p.id === savedId || p.slug === savedId
          );
          if (matched) {
            setCurrentProject(matched);
          } else {
            setCurrentProject(projList[0]);
            localStorage.setItem("agilent_active_project_id", projList[0].id);
          }
          return;
        } else {
          setProjects([]);
          setCurrentProject(null);
          localStorage.removeItem("agilent_active_project_id");
        }
      }
    } catch (err) {
      console.warn("API projects fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.status === 409) {
        return false;
      }

      if (!res.ok) throw new Error("Failed to create project");
      const result = await res.json();
      const newProj = result.project;

      if (newProj?.id) {
        localStorage.setItem("agilent_active_project_id", newProj.id);
      }
      await fetchProjects();
      setCurrentProject(newProj);
      return newProj;
    } catch (error: any) {
      console.error("Error creating project:", error);
      return null;
    }
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    if (project?.id) {
      localStorage.setItem("agilent_active_project_id", project.id);
    }
  };

  const updateProject = async (projectId: string, updates: { name?: string }) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { ...prev, ...updates } : null);
    }
    return true;
  };

  return {
    projects,
    currentProject,
    loading,
    createProject,
    selectProject,
    updateProject,
    refetch: fetchProjects,
  };
};
