import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, auditActivities, evidence, findings, researchProjects, users, workspaces, workflowModules } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod'] as const).forEach(field => {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = values[field]; }
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? 'admin'; updateSet.role = values.role; }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= values.lastSignedIn;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getOrCreateWorkspace(ownerId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(workspaces).where(and(eq(workspaces.ownerId, ownerId), eq(workspaces.status, 'active'))).orderBy(desc(workspaces.updatedAt)).limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(workspaces).values({ ownerId, name: 'Primary Research Workspace', description: 'Authorized security research operations.', status: 'active' });
  const id = Number(result[0].insertId);
  const created = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return created[0] ?? null;
}

export async function getDashboardData(ownerId: number) {
  const db = await getDb();
  const empty = { workspace: null, projects: [], findings: [], activities: [], stats: { projects: 0, openFindings: 0, highPriority: 0, evidence: 0 } };
  if (!db) return empty;
  const workspace = await getOrCreateWorkspace(ownerId);
  if (!workspace) return empty;
  const projects = await db.select().from(researchProjects).where(and(eq(researchProjects.workspaceId, workspace.id), eq(researchProjects.ownerId, ownerId))).orderBy(desc(researchProjects.updatedAt)).limit(50);
  const projectIds = projects.map(project => project.id);
  const allFindings = projectIds.length ? await db.select().from(findings).where(eq(findings.ownerId, ownerId)).orderBy(desc(findings.updatedAt)).limit(100) : [];
  const activities = await db.select().from(auditActivities).where(eq(auditActivities.workspaceId, workspace.id)).orderBy(desc(auditActivities.createdAt)).limit(12);
  const [evidenceCount] = await db.select({ count: sql<number>`count(*)` }).from(evidence).where(eq(evidence.ownerId, ownerId));
  return { workspace, projects, findings: allFindings.filter(finding => projectIds.includes(finding.projectId)), activities, stats: { projects: projects.length, openFindings: allFindings.filter(finding => ['open', 'triaged'].includes(finding.status)).length, highPriority: allFindings.filter(finding => ['critical', 'high'].includes(finding.severity) && finding.status !== 'remediated').length, evidence: Number(evidenceCount?.count ?? 0) } };
}

export async function createProject(input: { ownerId: number; workspaceId: number; name: string; target: string; authorization: string; scope: string; complianceChecklist: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  const result = await db.insert(researchProjects).values({ ...input, status: 'planning' });
  const id = Number(result[0].insertId);
  const created = await db.select().from(researchProjects).where(eq(researchProjects.id, id)).limit(1);
  if (!created[0]) throw new Error('Project could not be created');
  return created[0];
}

export async function createFinding(input: { ownerId: number; projectId: number; title: string; severity: 'critical'|'high'|'medium'|'low'|'info'; category: string; description: string; remediation?: string }) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  const result = await db.insert(findings).values({ ...input, status: 'open' });
  const id = Number(result[0].insertId);
  const created = await db.select().from(findings).where(eq(findings.id, id)).limit(1);
  if (!created[0]) throw new Error('Finding could not be created');
  return created[0];
}

export async function recordActivity(input: { workspaceId: number; actorId: number; entityType: string; entityId: number; action: string; metadata?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditActivities).values(input);
}

export async function updateProjectStatus(projectId: number, ownerId: number, status: typeof researchProjects.$inferInsert.status) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  await db.update(researchProjects).set({ status }).where(and(eq(researchProjects.id, projectId), eq(researchProjects.ownerId, ownerId)));
}

export async function updateFindingStatus(findingId: number, ownerId: number, status: typeof findings.$inferInsert.status) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  await db.update(findings).set({ status }).where(and(eq(findings.id, findingId), eq(findings.ownerId, ownerId)));
}

export async function addEvidence(input: typeof evidence.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  const result = await db.insert(evidence).values(input);
  return Number(result[0].insertId);
}

export async function updateWorkflowModule(projectId: number, module: typeof workflowModules.$inferInsert.module, status: typeof workflowModules.$inferInsert.status, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  const existing = await db.select().from(workflowModules).where(and(eq(workflowModules.projectId, projectId), eq(workflowModules.module, module))).limit(1);
  if (existing[0]) await db.update(workflowModules).set({ status, notes }).where(eq(workflowModules.id, existing[0].id));
  else await db.insert(workflowModules).values({ projectId, module, status, notes });
}
