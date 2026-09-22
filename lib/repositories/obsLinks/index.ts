import { PostgresObsLinkRepository } from "./postgres";

export const obsLinkRepo = new PostgresObsLinkRepository();

export type { ObsLinkRepository } from "./types";
