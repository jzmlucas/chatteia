import type {
    GiveawayChannel,
    GiveawayRow,
    GiveawayStatus,
    GiveawayWinner,
} from "@/types/giveaway";

export type UpsertGiveawayInput = {
    trigger: string;
    channels: GiveawayChannel[];
};

export interface GiveawayRepository {
    findByOwner(ownerUserId: string): Promise<GiveawayRow | null>;

    upsert(
        ownerUserId: string,
        input: UpsertGiveawayInput
    ): Promise<GiveawayRow>;

    updateStatus(
        ownerUserId: string,
        status: GiveawayStatus,
        winner?: GiveawayWinner | null
    ): Promise<GiveawayRow | null>;

    delete(ownerUserId: string): Promise<void>;
}
