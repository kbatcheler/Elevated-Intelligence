import { jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const tenantLayersTable = pgTable(
  "tenant_layers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    layerKey: text("layer_key").notNull(),
    content: jsonb("content").notNull().$type<Record<string, unknown>>(),
    verifiedClaims: jsonb("verified_claims")
      .notNull()
      .$type<unknown[]>()
      .default([]),
    modelledClaims: jsonb("modelled_claims")
      .notNull()
      .$type<unknown[]>()
      .default([]),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    generatorModel: text("generator_model").notNull(),
  },
  (t) => [unique("tenant_layers_tenant_id_layer_key_unique").on(t.tenantId, t.layerKey)],
);

export type TenantLayer = typeof tenantLayersTable.$inferSelect;
export type InsertTenantLayer = typeof tenantLayersTable.$inferInsert;
