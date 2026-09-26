import type {
    GiveawayChannel,
    GiveawayRow,
    GiveawayStatus,
    GiveawayWinner,
    GiveawayParticipant,
} from "@/types/giveaway";

export type UpsertGiveawayInput = {
    trigger: string;
    channels: GiveawayChannel[];
    durationSeconds: number | null;
    winnerCount: number;
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

    findOpenByChannel(platform: GiveawayParticipant["platform"], channelName: string): Promise<GiveawayRow[]>;

    addParticipant(input: {
        giveaway: GiveawayRow;
        username: string;
        displayName: string;
        platform: GiveawayParticipant["platform"];
        channelName: string;
    }): Promise<GiveawayRow | null>;

    drawWinners(ownerUserId: string): Promise<GiveawayRow | null>;

    delete(ownerUserId: string): Promise<void>;
}
