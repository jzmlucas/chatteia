export type ObsChatAnimationDirection =
    | "up"
    | "down"
    | "left"
    | "right";

export type ObsChatAnimationSpeed =
    | "slow"
    | "normal"
    | "fast";

export type ObsChatSettings = {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;

    showAvatar: boolean;
    showBadges: boolean;
    showTimestamp: boolean;
    showUsername: boolean;

    usernameColor: string;
    messageColor: string;

    messageBackground: boolean;
    messageBackgroundColor: string;
    messageBackgroundOpacity: number;

    borderRadius: number;
    messageSpacing: number;

    maxMessages: number;

    /**
     * Controla se as mensagens possuem
     * movimentação automática.
     */
    autoScroll: boolean;

    /**
     * Direção em que as mensagens
     * se movimentam.
     */
    animationDirection:
        | ObsChatAnimationDirection;

    /**
     * Velocidade da animação.
     */
    animationSpeed:
        | ObsChatAnimationSpeed;

    containerWidth: number;

    customCss: string;
};

export const DEFAULT_OBS_CHAT_SETTINGS: ObsChatSettings = {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: 400,

    showAvatar: true,
    showBadges: true,
    showTimestamp: false,
    showUsername: true,

    usernameColor: "#F55376",
    messageColor: "#ffffff",

    messageBackground: true,
    messageBackgroundColor: "#000000",
    messageBackgroundOpacity: 70,

    borderRadius: 10,
    messageSpacing: 8,

    maxMessages: 15,

    autoScroll: true,

    animationDirection: "up",

    animationSpeed: "normal",

    containerWidth: 100,

    customCss: "",
};