import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantProfileTable = pgTable("tenant_profile", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  profile: jsonb("profile").notNull().$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TenantProfile = typeof tenantProfileTable.$inferSelect;
export type InsertTenantProfile = typeof tenantProfileTable.$inferInsert;
