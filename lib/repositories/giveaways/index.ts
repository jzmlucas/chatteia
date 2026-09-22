import { PostgresGiveawayRepository } from "./postgres";

export const giveawayRepo = new PostgresGiveawayRepository();

export type { GiveawayRepository, UpsertGiveawayInput } from "./types";
