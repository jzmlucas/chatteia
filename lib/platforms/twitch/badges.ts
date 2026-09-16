export type BadgeInfo = {
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
};

export type BadgeMap = Record<
    string,
    Record<string, BadgeInfo>
>;

type TwitchHelixBadgeVersion = {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
};

type TwitchHelixBadgeSet = {
  set_id: string;
  versions: TwitchHelixBadgeVersion[];
};

type TwitchHelixBadgeResponse = {
  data: TwitchHelixBadgeSet[];
};

function toBadgeMap(
    data: TwitchHelixBadgeResponse
): BadgeMap {
  const result: BadgeMap = {};

  for (const badgeSet of data.data ?? []) {
    if (
        !badgeSet.set_id ||
        !Array.isArray(badgeSet.versions)
    ) {
      continue;
    }

    result[badgeSet.set_id] = {};

    for (const version of badgeSet.versions) {
      if (!version.id) {
        continue;
      }

      result[badgeSet.set_id][version.id] = {
        image_url_1x: version.image_url_1x,
        image_url_2x: version.image_url_2x,
        image_url_4x: version.image_url_4x,
        title: version.title,
        description: version.description,
      };
    }
  }

  return result;
}

export async function fetchBadgeMap(
    channelId?: string | null
): Promise<BadgeMap> {
  const endpoint = channelId
      ? `/api/platforms/twitch/badges?channelId=${encodeURIComponent(
          channelId
      )}`
      : "/api/platforms/twitch/badges";

  const response = await fetch(endpoint, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    console.error(
        "[TwitchBadges] Erro HTTP:",
        response.status,
        body
    );

    throw new Error(
        `Badges API HTTP ${response.status}`
    );
  }

  const data =
      (await response.json()) as TwitchHelixBadgeResponse;

  return toBadgeMap(data);
}