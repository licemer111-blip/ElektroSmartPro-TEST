// ─── Barrel re-exports — preserves all existing imports in UI ─────────────────
// Domain split:
//   activity-actions.ts      → getUserProfile, getRecentClientActivity, deleteNotification, clearAllNotifications
//   project-ops-actions.ts   → getProjects, getRegions, getObjectTypes, createProject, duplicateProject,
//                              deleteProject, updateProjectSettings, bulkDeleteProjects, bulkArchiveProjects,
//                              bulkRestoreProjects, bulkMoveToCategory
//   category-actions.ts      → createAssemblyCategory, updateAssemblyCategory, deleteAssemblyCategory,
//                              moveAssemblyToCategory, createProjectCategory, updateProjectCategory,
//                              deleteProjectCategory, moveProjectToCategory

export { getUserProfile, getRecentClientActivity, deleteNotification, clearAllNotifications } from "./activity-actions";

export {
  getProjects,
  getRegions,
  getObjectTypes,
  createProject,
  duplicateProject,
  deleteProject,
  updateProjectSettings,
  bulkDeleteProjects,
  bulkArchiveProjects,
  bulkRestoreProjects,
  bulkMoveToCategory,
  createDemoProject,
} from "./project-ops-actions";

export {
  createAssemblyCategory,
  updateAssemblyCategory,
  deleteAssemblyCategory,
  moveAssemblyToCategory,
  createProjectCategory,
  updateProjectCategory,
  deleteProjectCategory,
  moveProjectToCategory,
} from "./category-actions";
