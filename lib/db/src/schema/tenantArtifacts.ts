import { jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantArtifactsTable = pgTable(
  "tenant_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    content: jsonb("content").notNull().$type<Record<string, unknown>>(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("tenant_artifacts_tenant_id_kind_unique").on(t.tenantId, t.kind)],
);

export type TenantArtifact = typeof tenantArtifactsTable.$inferSelect;
export type InsertTenantArtifact = typeof tenantArtifactsTable.$inferInsert;
