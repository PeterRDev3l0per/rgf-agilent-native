import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  created_at: string;
}

const DEFAULT_NATIVE_PROJECT: Project = {
  id: "rgf-agilent-native",
  name: "Agilent Native Suite 🚀",
  slug: "rgf-agilent-native",
  status: "active",
  created_at: new Date().toISOString(),
};

export const useProjects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([DEFAULT_NATIVE_PROJECT]);
  const [currentProject, setCurrentProject] = useState<Project | null>(DEFAULT_NATIVE_PROJECT);
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
        }
      }
    } catch (err) {
      console.warn("API projects fetch failed, using fallback:", err);
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
        const err = await res.json();
        toast({
          title: "Nombre en uso",
          description: err.detail || "Ya existe un proyecto con ese nombre.",
          variant: "destructive",
        });
        return null;
      }

      if (!res.ok) throw new Error("Failed to create project");
      const result = await res.json();
      const newProj = result.project;

      toast({
        title: "¡Proyecto creado!",
        description: `"${newProj.name}" fue creado y guardado en SQLite`,
      });

      await fetchProjects();
      setCurrentProject(newProj);
      if (newProj?.id) {
        localStorage.setItem("agilent_active_project_id", newProj.id);
      }
      return newProj;
    } catch (error: any) {
      toast({
        title: "Error al crear proyecto",
        description: error.message || "Error de red",
        variant: "destructive",
      });
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
