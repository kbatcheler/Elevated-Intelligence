// Pre-seeded committed actions. Phase 1 starts every tenant with an empty
// tray; the Committed Actions page fills as the operator commits items from
// each layer's recommended-actions list.

import type { CommittedAction } from "../context/AppContext";

export type CommittedSeed = Omit<CommittedAction, "id" | "committedAt">;

export const COMMITTED_SEED: CommittedSeed[] = [];
