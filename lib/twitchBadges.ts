export type BadgeVersionInfo = {
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
};

export type BadgeMap = Record<
  string,
  Record<string, BadgeVersionInfo>
>;

const GLOBAL_BADGES_URL =
  "https://badges.twitch.tv/v1/badges/global/display?language=pt";

function channelBadgesUrl(channelId: string) {
  return `https://badges.twitch.tv/v1/badges/channels/${channelId}/display?language=pt`;
    }

function toBadgeMap(json: unknown): BadgeMap {
  const result: BadgeMap = {};

  if (!json || typeof json !== "object") {
    return result;
  }

  const data = json as {
    badge_sets?: Record<
        string,
        {
          versions?: Record<string, BadgeVersionInfo>;
        }
    >;
  };

  const sets = data.badge_sets ?? {};

  for (const [setId, set] of Object.entries(sets)) {
    if (set?.versions) {
      result[setId] = set.versions;
    }
  }

  return result;
}

function mergeBadgeMaps(
    base: BadgeMap,
    override: BadgeMap
): BadgeMap {
  const merged: BadgeMap = {};

  for (const [setId, versions] of Object.entries(base)) {
    merged[setId] = { ...versions };
  }

  for (const [setId, versions] of Object.entries(override)) {
    merged[setId] = {
      ...(merged[setId] ?? {}),
      ...versions,
    };
  }

  return merged;
}

const cache = new Map<string, Promise<BadgeMap>>();

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
        `Twitch badges HTTP ${response.status}: ${url}`
    );
  }

  return response.json();
}

export async function fetchBadgeMap(
    channelId: string | null
): Promise<BadgeMap> {
  const cacheKey = channelId || "__global_only__";

  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const globalJson = await fetchJson(GLOBAL_BADGES_URL);
      const globalMap = toBadgeMap(globalJson);

      if (!channelId) {
        return globalMap;
      }

      try {
        const channelJson = await fetchJson(
            channelBadgesUrl(channelId)
        );

        const channelMap = toBadgeMap(channelJson);

        return mergeBadgeMaps(globalMap, channelMap);
      } catch (error) {
        console.warn(
            "[TwitchBadges] Falha ao buscar badges do canal:",
            error
        );

        return globalMap;
      }
    } catch (error) {
      console.error(
          "[TwitchBadges] Falha ao buscar badges globais:",
          error
      );

      return {};
    }
  })();

  cache.set(cacheKey, promise);

  return promise;
}