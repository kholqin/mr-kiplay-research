import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { addEvidence, createFinding, createProject, getDashboardData, getOrCreateWorkspace, recordActivity, updateFindingStatus, updateProjectStatus, updateWorkflowModule } from "./db";
import { storagePut } from "./storage";

const severity = z.enum(["critical", "high", "medium", "low", "info"]);
const moduleName = z.enum(["android", "web", "binary", "network", "fuzzing", "source_analysis", "correlation", "evidence", "reporting"]);
const moduleStatus = z.enum(["not_started", "in_progress", "blocked", "complete"]);
const projectStatus = z.enum(["planning", "in_progress", "review", "completed", "paused"]);
const findingStatus = z.enum(["open", "triaged", "remediated", "accepted", "false_positive"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  research: router({
    dashboard: protectedProcedure.query(({ ctx }) => getDashboardData(ctx.user.id)),
    createProject: protectedProcedure.input(z.object({ name: z.string().min(3).max(180), target: z.string().min(1).max(500), authorization: z.string().min(10), scope: z.string().min(3), complianceChecklist: z.string().min(3) })).mutation(async ({ ctx, input }) => {
      const workspace = await getOrCreateWorkspace(ctx.user.id); if (!workspace) throw new Error('Workspace unavailable');
      const project = await createProject({ ...input, ownerId: ctx.user.id, workspaceId: workspace.id });
      await recordActivity({ workspaceId: workspace.id, actorId: ctx.user.id, entityType: 'project', entityId: project.id, action: 'project.created', metadata: JSON.stringify({ target: input.target }) });
      await notifyOwner({ title: 'Research project created', content: `${input.name} was added with an authorization record.` });
      return project;
    }),
    updateProjectStatus: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), status: projectStatus })).mutation(async ({ ctx, input }) => {
      await updateProjectStatus(input.projectId, ctx.user.id, input.status); const workspace = await getOrCreateWorkspace(ctx.user.id);
      if (workspace) await recordActivity({ workspaceId: workspace.id, actorId: ctx.user.id, entityType: 'project', entityId: input.projectId, action: `project.status.${input.status}` });
      await notifyOwner({ title: 'Research project status changed', content: `Project #${input.projectId} is now ${input.status}.` }); return { success: true } as const;
    }),
    createFinding: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), title: z.string().min(3).max(220), severity, category: z.string().min(2).max(120), description: z.string().min(10), remediation: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const dashboard = await getDashboardData(ctx.user.id); if (!dashboard.projects.some(project => project.id === input.projectId)) throw new Error('Project is outside your authorized workspace');
      const finding = await createFinding({ ...input, ownerId: ctx.user.id }); const workspace = dashboard.workspace;
      if (workspace) await recordActivity({ workspaceId: workspace.id, actorId: ctx.user.id, entityType: 'finding', entityId: finding.id, action: 'finding.created', metadata: JSON.stringify({ severity: input.severity }) });
      if (['critical', 'high'].includes(input.severity)) await notifyOwner({ title: `${input.severity.toUpperCase()} finding created`, content: input.title }); return finding;
    }),
    updateFindingStatus: protectedProcedure.input(z.object({ findingId: z.number().int().positive(), status: findingStatus })).mutation(async ({ ctx, input }) => {
      await updateFindingStatus(input.findingId, ctx.user.id, input.status); const workspace = await getOrCreateWorkspace(ctx.user.id);
      if (workspace) await recordActivity({ workspaceId: workspace.id, actorId: ctx.user.id, entityType: 'finding', entityId: input.findingId, action: `finding.status.${input.status}` }); return { success: true } as const;
    }),
    updateModule: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), module: moduleName, status: moduleStatus, notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const dashboard = await getDashboardData(ctx.user.id); if (!dashboard.projects.some(project => project.id === input.projectId)) throw new Error('Project is outside your authorized workspace');
      await updateWorkflowModule(input.projectId, input.module, input.status, input.notes); const workspace = dashboard.workspace;
      if (workspace) await recordActivity({ workspaceId: workspace.id, actorId: ctx.user.id, entityType: 'workflow', entityId: input.projectId, action: `workflow.${input.module}.${input.status}` }); return { success: true } as const;
    }),
    attachEvidence: protectedProcedure.input(z.object({ findingId: z.number().int().positive(), fileName: z.string().min(1).max(255), mimeType: z.string().min(1).max(120), dataBase64: z.string().min(1).max(8_000_000) })).mutation(async ({ ctx, input }) => {
      const dashboard = await getDashboardData(ctx.user.id); if (!dashboard.findings.some(finding => finding.id === input.findingId)) throw new Error('Finding is outside your authorized workspace');
      const buffer = Buffer.from(input.dataBase64, 'base64'); if (buffer.byteLength > 6_000_000) throw new Error('Evidence file exceeds the 6 MB limit');
      const stored = await storagePut(`${ctx.user.id}/evidence/${input.fileName}`, buffer, input.mimeType); const evidenceId = await addEvidence({ findingId: input.findingId, ownerId: ctx.user.id, fileName: input.fileName, fileKey: stored.key, url: stored.url, mimeType: input.mimeType, sizeBytes: buffer.byteLength });
      if (dashboard.workspace) await recordActivity({ workspaceId: dashboard.workspace.id, actorId: ctx.user.id, entityType: 'evidence', entityId: evidenceId, action: 'evidence.attached', metadata: JSON.stringify({ fileName: input.fileName }) }); return { evidenceId, url: stored.url };
    }),
  }),
});
export type AppRouter = typeof appRouter;
