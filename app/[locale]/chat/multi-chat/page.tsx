"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTwitchMultiChat } from "@/hooks/platforms/twitch/useTwitchMultiChat";
import { useKickMultiChat } from "@/hooks/platforms/kick/useKickMultiChat";
import { ChatFeed, type FeedMessage } from "@/components/chat/ChatFeed";
import { normalizeChatTarget, targetKey, type ChatTarget } from "@/lib/chat/targets";

const CHANNEL_COLORS = ["#9146FF", "#53FC18", "#00D4FF", "#FF9800"];

export default function MultiChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [platform, setPlatform] = useState<"twitch" | "kick">("twitch");
  const [newChannel, setNewChannel] = useState("");

  const targets = useMemo<ChatTarget[]>(() => {
    const raw = searchParams.get("channels") ?? "";
    return raw
      .split(",")
      .map(normalizeChatTarget)
      .filter((target): target is ChatTarget => target !== null)
      .filter(
        (target, index, all) =>
          all.findIndex((item) => targetKey(item) === targetKey(target)) === index
      )
      .slice(0, 4);
  }, [searchParams]);

  const twitchChannels = useMemo(
    () => targets.filter((target) => target.platform === "twitch").map((target) => target.channel),
    [targets]
  );
  const kickChannels = useMemo(
    () => targets.filter((target) => target.platform === "kick").map((target) => target.channel),
    [targets]
  );

  const twitch = useTwitchMultiChat(twitchChannels);
  const kick = useKickMultiChat(kickChannels);

  const connectionMap = useMemo(() => {
    const result: Record<string, { status: string; messages: FeedMessage[] }> = {};

    for (const target of targets) {
      const key = targetKey(target);
      const connection =
        target.platform === "twitch"
          ? twitch.connections[target.channel]
          : kick.connections[target.channel];

      result[key] = {
        status: connection?.status ?? "idle",
        messages: connection?.messages ?? [],
      };
    }

    return result;
  }, [targets, twitch.connections, kick.connections]);

  const feedMessages = useMemo<FeedMessage[]>(() => {
    const all: FeedMessage[] = [];

    targets.forEach((target, index) => {
      const connection = connectionMap[targetKey(target)];
      const label = `${target.platform === "twitch" ? "TWITCH" : "KICK"} · ${target.channel}`;

      for (const message of connection?.messages ?? []) {
        if (
          filter &&
          !message.message.toLowerCase().includes(filter.toLowerCase()) &&
          !message.displayName.toLowerCase().includes(filter.toLowerCase())
        ) {
          continue;
        }

        all.push({
          ...message,
          channelLabel: label,
          channelColor: CHANNEL_COLORS[index % CHANNEL_COLORS.length],
        });
      }
    });

    return all.sort((a, b) => a.timestamp - b.timestamp);
  }, [targets, connectionMap, filter]);

  function updateUrl(nextTargets: ChatTarget[]) {
    if (nextTargets.length === 0) {
      router.push("/");
      return;
    }

    router.replace(
      `/chat/multi-chat?channels=${encodeURIComponent(
        nextTargets.map(targetKey).join(",")
      )}`
    );
  }

  function addChannel(event: React.FormEvent) {
    event.preventDefault();
    const target = normalizeChatTarget(`${platform}:${newChannel}`);
    if (!target) return;
    if (targets.some((item) => targetKey(item) === targetKey(target))) return;
    if (targets.length >= 4) return;

    updateUrl([...targets, target]);
    setNewChannel("");
    setShowAdd(false);
  }

  function removeTarget(target: ChatTarget) {
    const next = targets.filter((item) => targetKey(item) !== targetKey(target));
    if (next.length === 1) {
      if (next[0].platform === "kick") {
        router.push(`/chat/kick/${next[0].channel}`);
      } else {
        router.push(`/chat/${next[0].channel}`);
      }
      return;
    }
    updateUrl(next);
  }

  const connectedCount = targets.filter(
    (target) => connectionMap[targetKey(target)]?.status === "connected"
  ).length;

  return (
    <main className="h-dvh flex flex-col overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 border-b border-twitch-border bg-twitch-panel px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
              href="/"
              className="shrink-0 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <img
                width="32"
                height="32"
                src="https://img.icons8.com/color-glass/48/parrot.png"
                alt="parrot"
            />
          </Link>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {targets.map((target, index) => (
              <div key={targetKey(target)} className="flex items-center gap-1">
                <span
                  className="text-sm font-semibold"
                  style={{ color: CHANNEL_COLORS[index % CHANNEL_COLORS.length] }}
                >
                  {target.platform === "twitch" ? "TW" : "KI"} · #{target.channel}
                </span>
                <button
                  type="button"
                  onClick={() => removeTarget(target)}
                  className="text-zinc-500 hover:text-white"
                  aria-label={`Remover ${targetKey(target)}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {targets.length < 4 && (
            <button
              type="button"
              onClick={() => setShowAdd((value) => !value)}
              className="h-7 w-7 rounded text-lg text-zinc-500 hover:text-white"
              aria-label="Adicionar canal"
            >
              +
            </button>
          )}

          {showAdd && targets.length < 4 && (
            <form onSubmit={addChannel} className="flex items-center gap-2">
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value as "twitch" | "kick")}
                className="rounded-md border border-twitch-border bg-twitch-dark px-2 py-1.5 text-sm outline-none"
              >
                <option value="twitch">Twitch</option>
                <option value="kick">KICK</option>
              </select>
              <input
                autoFocus
                value={newChannel}
                onChange={(event) => setNewChannel(event.target.value)}
                placeholder="nome do canal"
                className="w-36 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-twitch-purple sm:w-48"
              />
              <button
                type="submit"
                className="rounded-md bg-twitch-purple px-3 py-1.5 text-sm font-medium hover:bg-purple-600"
              >
                Adicionar
              </button>
            </form>
          )}

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                connectedCount === targets.length && targets.length > 0
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
            {connectedCount}/{targets.length} conectados
          </div>

          <div className="ml-auto">
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Buscar mensagens…"
              className="w-40 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-twitch-purple sm:w-56"
            />
          </div>
        </div>
      </header>

      <ChatFeed
        messages={feedMessages}
        showChannelTag
        emptyLabel={
          targets.length === 0
            ? "Nenhum canal adicionado."
            : "Aguardando mensagens dos chats…"
        }
      />
    </main>
  );
}
