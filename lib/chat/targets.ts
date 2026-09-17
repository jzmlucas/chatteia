import type { ChatPlatform } from "./types";

export type ChatTarget = {
  platform: ChatPlatform;
  channel: string;
};

function normalizeLogin(
    value: string
) {
  return value
      .trim()
      .replace(/^#/, "")
      .trim()
      .toLowerCase();
}

function isValidTwitchOrKickChannel(
    value: string
) {
  return /^[a-zA-Z0-9_]{3,25}$/.test(
      value
  );
}

function isValidYouTubeValue(
    value: string
) {
  return /^[a-zA-Z0-9_@-]{3,100}$/.test(
      value
  );
}

function parseTwitchChannel(
    value: string
) {
  const input =
      value.trim();

  if (
      input.startsWith("@")
  ) {
    return null;
  }

  if (
      /^https?:\/\//i.test(input) ||
      /^www\./i.test(input) ||
      /^twitch\.tv\//i.test(input)
  ) {
    let url: URL;

    try {
      const normalizedUrl =
          /^https?:\/\//i.test(input)
              ? input
              : `https://${input}`;

      url = new URL(
          normalizedUrl
      );
    } catch {
      return null;
    }

    const hostname =
        url.hostname
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );

    if (
        hostname !==
        "twitch.tv"
    ) {
      return null;
    }

    const parts =
        url.pathname
            .split("/")
            .filter(Boolean);

    if (
        parts.length !==
        1
    ) {
      return null;
    }

    const channel =
        parts[0].trim();

    if (
        channel.startsWith("@")
    ) {
      return null;
    }

    return channel;
  }

  return normalizeLogin(
      input
  );
}

function parseKickChannel(
    value: string
) {
  const input =
      value.trim();

  if (
      input.startsWith("@")
  ) {
    return null;
  }

  if (
      /^https?:\/\//i.test(input) ||
      /^www\./i.test(input) ||
      /^kick\.com\//i.test(input)
  ) {
    let url: URL;

    try {
      const normalizedUrl =
          /^https?:\/\//i.test(input)
              ? input
              : `https://${input}`;

      url = new URL(
          normalizedUrl
      );
    } catch {
      return null;
    }

    const hostname =
        url.hostname
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );

    if (
        hostname !==
        "kick.com"
    ) {
      return null;
    }

    const parts =
        url.pathname
            .split("/")
            .filter(Boolean);

    if (
        parts.length !==
        1
    ) {
      return null;
    }

    const channel =
        parts[0].trim();

    if (
        channel.startsWith("@")
    ) {
      return null;
    }

    return channel;
  }

  return normalizeLogin(
      input
  );
}

function parseYouTubeChannel(
    value: string
) {
  const input =
      value.trim();

  if (!input) {
    return null;
  }

  if (
      /^https?:\/\//i.test(input) ||
      /^www\./i.test(input) ||
      /^youtube\.com\//i.test(input) ||
      /^youtu\.be\//i.test(input)
  ) {
    let url: URL;

    try {
      const normalizedUrl =
          /^https?:\/\//i.test(input)
              ? input
              : `https://${input}`;

      url = new URL(
          normalizedUrl
      );
    } catch {
      return null;
    }

    const hostname =
        url.hostname
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );

    if (
        hostname !==
        "youtube.com" &&
        hostname !==
        "youtu.be"
    ) {
      return null;
    }

    if (
        hostname ===
        "youtu.be"
    ) {
      const parts =
          url.pathname
              .split("/")
              .filter(Boolean);

      return parts.length ===
      1
          ? parts[0].trim()
          : null;
    }

    const parts =
        url.pathname
            .split("/")
            .filter(Boolean);

    if (
        parts.length ===
        2
    ) {
      const type =
          parts[0].toLowerCase();

      const valuePart =
          parts[1].trim();

      if (
          type ===
          "channel" ||
          type ===
          "user" ||
          type ===
          "c"
      ) {
        return valuePart;
      }
    }

    if (
        parts.length ===
        1 &&
        parts[0].startsWith("@")
    ) {
      return parts[0];
    }

    return null;
  }

  return input
      .replace(
          /^#/,
          ""
      )
      .trim();
}

function normalizeYouTubeChannel(
    value: string
) {
  const parsed =
      parseYouTubeChannel(
          value
      );

  if (!parsed) {
    return null;
  }

  const channel =
      parsed.trim();

  if (
      !isValidYouTubeValue(
          channel
      )
  ) {
    return null;
  }

  if (
      channel.startsWith("@")
  ) {
    return channel
        .slice(1)
        .toLowerCase();
  }

  if (
      /^UC[a-zA-Z0-9_-]+$/.test(
          channel
      )
  ) {
    return channel;
  }

  return channel.toLowerCase();
}

function parseTikTokChannel(
    value: string
) {
  const input =
      value.trim();

  if (
      /^https?:\/\//i.test(input) ||
      /^www\./i.test(input) ||
      /^tiktok\.com\//i.test(input)
  ) {
    let url: URL;

    try {
      const normalizedUrl =
          /^https?:\/\//i.test(input)
              ? input
              : `https://${input}`;

      url = new URL(
          normalizedUrl
      );
    } catch {
      return null;
    }

    const hostname =
        url.hostname
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );

    if (
        hostname !==
        "tiktok.com"
    ) {
      return null;
    }

    const parts =
        url.pathname
            .split("/")
            .filter(Boolean);

    if (
        parts.length < 1 ||
        !parts[0].startsWith("@")
    ) {
      return null;
    }

    return parts[0].slice(1);
  }

  return normalizeLogin(
      input
  ).replace(/^@/, "");
}

function isValidTikTokChannel(
    value: string
) {
  return /^[a-zA-Z0-9_.]{2,50}$/.test(
      value
  );
}

export function normalizeChatTarget(
    value: string
): ChatTarget | null {
  const raw =
      value.trim();

  if (!raw) {
    return null;
  }

  const separator =
      raw.indexOf(":");

  const platform =
      separator > 0
          ? raw
              .slice(
                  0,
                  separator
              )
              .toLowerCase()
          : "twitch";

  const channel =
      separator > 0
          ? raw.slice(
              separator + 1
          )
          : raw;

  if (
      platform ===
      "twitch"
  ) {
    const normalized =
        parseTwitchChannel(
            channel
        );

    if (
        !normalized ||
        !isValidTwitchOrKickChannel(
            normalized
        )
    ) {
      return null;
    }

    return {
      platform: "twitch",
      channel:
          normalized.toLowerCase(),
    };
  }

  if (
      platform ===
      "kick"
  ) {
    const normalized =
        parseKickChannel(
            channel
        );

    if (
        !normalized ||
        !isValidTwitchOrKickChannel(
            normalized
        )
    ) {
      return null;
    }

    return {
      platform: "kick",
      channel:
          normalized.toLowerCase(),
    };
  }

  if (
      platform ===
      "youtube"
  ) {
    const normalized =
        normalizeYouTubeChannel(
            channel
        );

    if (!normalized) {
      return null;
    }

    return {
      platform: "youtube",
      channel:
      normalized,
    };
  }

  if (
      platform ===
      "tiktok"
  ) {
    const normalized =
        parseTikTokChannel(
            channel
        );

    if (
        !normalized ||
        !isValidTikTokChannel(
            normalized
        )
    ) {
      return null;
    }

    return {
      platform: "tiktok",
      channel:
          normalized.toLowerCase(),
    };
  }

  return null;
}

export function targetKey(
    target: ChatTarget
) {
  return `${target.platform}:${target.channel}`;
}