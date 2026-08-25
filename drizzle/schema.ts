import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const researchProjects = mysqlTable("researchProjects", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  target: varchar("target", { length: 500 }).notNull(),
  authorization: text("authorization").notNull(),
  scope: text("scope").notNull(),
  status: mysqlEnum("status", ["planning", "in_progress", "review", "completed", "paused"]).default("planning").notNull(),
  complianceChecklist: text("complianceChecklist").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const findings = mysqlTable("findings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).default("info").notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  description: text("description").notNull(),
  remediation: text("remediation"),
  status: mysqlEnum("status", ["open", "triaged", "remediated", "accepted", "false_positive"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  findingId: int("findingId").notNull(),
  ownerId: int("ownerId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workflowModules = mysqlTable("workflowModules", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  module: mysqlEnum("module", ["android", "web", "binary", "network", "fuzzing", "source_analysis", "correlation", "evidence", "reporting"]).notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "blocked", "complete"]).default("not_started").notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditActivities = mysqlTable("auditActivities", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  actorId: int("actorId").notNull(),
  entityType: varchar("entityType", { length: 60 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type ResearchProject = typeof researchProjects.$inferSelect;
export type Finding = typeof findings.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type WorkflowModule = typeof workflowModules.$inferSelect;
export type AuditActivity = typeof auditActivities.$inferSelect;
