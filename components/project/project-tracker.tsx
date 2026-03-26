"use client";

import { useEffect } from "react";

interface ProjectTrackerProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
}

/**
 * Client component to track project visits in localStorage
 * Add this component to project pages to automatically track visits
 */
export function ProjectTracker({ projectId, projectName, projectStatus }: ProjectTrackerProps) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentProjects");
      let projects: Array<{
        id: string;
        name: string;
        status: string;
        visitedAt: string;
      }> = stored ? JSON.parse(stored) : [];

      // Remove current project if it exists
      projects = projects.filter(p => p.id !== projectId);

      // Add current project to the beginning
      projects.unshift({
        id: projectId,
        name: projectName,
        status: projectStatus,
        visitedAt: new Date().toISOString(),
      });

      // Keep only last 10 projects
      projects = projects.slice(0, 10);

      localStorage.setItem("recentProjects", JSON.stringify(projects));
    } catch {
      // ignore tracking error
    }
  }, [projectId, projectName, projectStatus]);

  return null; // This component doesn't render anything
}
