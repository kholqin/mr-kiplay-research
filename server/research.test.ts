import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = (): TrpcContext => ({
  user: { id: 7, openId: "researcher", name: "Researcher", email: "researcher@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("research safety boundaries", () => {
  it("rejects project creation without an authorization record", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.research.createProject({ name: "Lab project", target: "local-app", authorization: "short", scope: "local" , complianceChecklist: "scope" })).rejects.toThrow();
  });

  it("rejects findings with unsupported severity", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.research.createFinding({ projectId: 1, title: "Observation", severity: "exploit" as never, category: "review", description: "An observation recorded during authorized review." })).rejects.toThrow();
  });
});
