import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantProfileTable = pgTable("tenant_profile", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  profile: jsonb("profile").notNull().$type<Record<string, unknown>>(),
  // Tenant-scope brief overrides (Phase 2 sub-stage 9). Populated by a
  // single Haiku call that takes the profile + ALL final layer contents and
  // emits the rich copy the MorningBrief + BoardPack briefs render.
  // Nullable so older tenants (and fresh tenants before the briefs stage
  // runs) still load. Backfillable via POST /api/tenants/:id/panels/backfill.
  briefOverrides: jsonb("brief_overrides").$type<Record<string, unknown> | null>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantProfile = typeof tenantProfileTable.$inferSelect;
export type InsertTenantProfile = typeof tenantProfileTable.$inferInsert;
