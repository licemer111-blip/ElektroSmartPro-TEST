// ─── Barrel re-exports — preserves all existing imports in UI ─────────────────
// Domain split:
//   invite-actions.ts     → Invitations (invite, accept, decline, cancel, getPending, getOutgoing)
//   member-actions.ts     → Member removal, leaveTeam, storage/attachment helpers
//   role-actions.ts       → Role updates (admin-guarded updateMemberRole)
//   team-data-actions.ts  → Teams CRUD, members list, shared catalog/assemblies, stats
//   chat-actions.ts       → Team chat messages (send, get, edit, delete, attachments)

export {
  getPendingTeamInvitations,
  getTeamOutgoingInvitations,
  inviteTeamMember,
  acceptTeamInvitation,
  declineTeamInvitation,
  cancelTeamInvitation,
  acceptInvitation,
  declineInvitation,
} from "./invite-actions";

export {
  removeTeamMember,
  leaveTeam,
  ensureTeamAttachmentsBucket,
  ensureAttachmentColumns,
  uploadTeamAttachment,
} from "./member-actions";

export {
  updateMemberRole,
  updateMemberRoleLegacy,
} from "./role-actions";

export {
  getUserTeam,
  getAllUserTeams,
  getTeamMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamCatalogItems,
  getTeamAssemblies,
  removeItemFromTeam,
  removeAssemblyFromTeam,
  getTeamDataStats,
} from "./team-data-actions";

export {
  sendTeamMessage,
  getTeamMessages,
  editTeamMessage,
  deleteTeamMessage,
  sendTeamMessageWithAttachment,
} from "./chat-actions";
