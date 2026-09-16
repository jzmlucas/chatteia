import crypto from "node:crypto";
import { normalizeKickMessage } from "./adapter";
import { publishKickChat } from "./bus";
import type { KickChatMessage } from "./types";

const KICK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq/+l1WnlRrGSolDMA+A8
6rAhMbQGmQ2SapVcGM3zq8ANXjnhDWocMqfWcTd95btDydITa10kDvHzw9WQOqp2
MZI7ZyrfzJuz5nhTPCiJwTwnEtWft7nV14BYRDHvlfqPUaZ+1KR4OCaO/wWIk/rQ
L/TjY0M70gse8rlBkbo2a8rKhu69RQTRsoaf4DVhDPEeSeI5jVrRDGAMGL3cGuyY
6CLKGdjVEM78g3fYOvDU/RvfqD7L89TZ3iN94jrmWdGz34JNlEI5hqK8dd7C5EF
BEbZ5jgB8s8ReQV8H+MkuffjdAj3ajDDX3DOJMIut1lBrUVD1AaSrGCKHooWoL2e
twIDAQAB
-----END PUBLIC KEY-----`;

export function verifyKickSignature(
  body: string,
  messageId: string,
  timestamp: string,
  signature: string
) {
  const payload = `${messageId}.${timestamp}.${body}`;

  const verifier = crypto.createVerify("RSA-SHA256");

  verifier.update(payload);
  verifier.end();

  return verifier.verify(
    KICK_PUBLIC_KEY,
    signature,
    "base64"
  );
}

export async function handleKickWebhook(
  request: Request
) {
  const body = await request.text();
  const headers = request.headers;

  const messageId = headers.get(
    "Kick-Event-Message-Id"
  );

  const timestamp = headers.get(
    "Kick-Event-Message-Timestamp"
  );

  const signature = headers.get(
    "Kick-Event-Signature"
  );

  const eventType = headers.get(
    "Kick-Event-Type"
  );

  if (
    !messageId ||
    !timestamp ||
    !signature
  ) {
    return new Response(
      "Missing signature headers.",
      { status: 401 }
    );
  }

  if (
    !verifyKickSignature(
      body,
      messageId,
      timestamp,
      signature
    )
  ) {
    return new Response(
      "Invalid signature.",
      { status: 401 }
    );
  }

  if (
    eventType !== "chat.message.sent"
  ) {
    return Response.json({
      ok: true,
      ignored: true,
    });
  }

  try {
    const payload =
      JSON.parse(body) as KickChatMessage;

    console.log(
      "[KICK] PAYLOAD EMOTES:",
      {
        channel:
          payload.broadcaster
            ?.channel_slug,

        username:
          payload.sender
            ?.username,

        content:
          payload.content,

        emotes:
          payload.emotes,
      }
    );

    const message =
      normalizeKickMessage(payload);

    publishKickChat(message);

    console.log(
      "[KICK] Chat message:",
      {
        channel:
          message.channel,

        username:
          message.username,

        id:
          message.id,
      }
    );

    return Response.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "[KICK] Webhook:",
      error
    );

    return new Response(
      "Invalid payload.",
      { status: 400 }
    );
  }
}