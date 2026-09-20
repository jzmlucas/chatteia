import assert from "node:assert/strict";
import { test, after } from "node:test";

process.env.BILLING_ENFORCED = "true";

const { pool } = await import("@/lib/db/pool");
const { handleStripeEvent } = await import("@/lib/billing/webhook");
const { ensureStripeCustomer, findSubscriptionByUserId } = await import("@/lib/billing/subscriptions");
const { isSubscriptionEntitled, hasStreamerAccess, PERIOD_GRACE_MS } = await import("@/lib/billing/entitlements");

after(() => pool.end());

let seq = 0;
async function mkUser(mode: "user" | "streamer" = "streamer") {
    seq++;
    const { rows } = await pool.query(
        `insert into users (email, username, account_type, active_mode)
         values ($1, $2, 'streamer', $3) returning id`,
        [`u${seq}@t.com`, `user${seq}xx`, mode]
    );
    return rows[0].id as string;
}
const DAY = 86400;
const now = () => Math.floor(Date.now() / 1000);

function ev(id: string, type: string, created: number, sub: any): any {
    return { id, type, created, data: { object: sub } };
}
function sub(o: { id: string; customer: string; status: string; end?: number; cancel?: boolean; meta?: any; trial?: number | null }): any {
    return {
        id: o.id, customer: o.customer, status: o.status,
        cancel_at_period_end: o.cancel ?? false, trial_end: o.trial ?? null,
        metadata: o.meta ?? {},
        items: { data: [{ current_period_end: o.end ?? now() + 30 * DAY, price: { id: "price_x" } }] },
    };
}
const modeOf = async (id: string) => (await pool.query("select active_mode from users where id=$1", [id])).rows[0].active_mode;

test("entitlement: regras puras", () => {
    const t = Date.now();
    const d = (ms: number) => new Date(t + ms);
    assert.equal(isSubscriptionEntitled(null), false);
    assert.equal(isSubscriptionEntitled({ status: "active", current_period_end: d(1000) }, t), true);
    assert.equal(isSubscriptionEntitled({ status: "trialing", current_period_end: d(1000) }, t), true);
    assert.equal(isSubscriptionEntitled({ status: "past_due", current_period_end: d(-1000) }, t), true, "past_due dentro da folga");
    assert.equal(isSubscriptionEntitled({ status: "past_due", current_period_end: d(-PERIOD_GRACE_MS - 1) }, t), false, "past_due além da folga");
    assert.equal(isSubscriptionEntitled({ status: "active", current_period_end: null }, t), true, "cortesia sem validade");
    for (const s of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", "qualquer_coisa_nova"])
        assert.equal(isSubscriptionEntitled({ status: s, current_period_end: d(1e9) }, t), false, s);
    // flag desligada libera tudo
    process.env.BILLING_ENFORCED = "false";
    assert.equal(hasStreamerAccess(null), true);
    process.env.BILLING_ENFORCED = "true";
    assert.equal(hasStreamerAccess(null), false);
});

test("fluxo feliz: checkout cria customer -> subscription.created libera", async () => {
    const u = await mkUser("user");
    const row0 = await ensureStripeCustomer(u, "cus_A1");
    assert.equal(row0.status, "incomplete");
    assert.equal(hasStreamerAccess(row0), false);

    const r = await handleStripeEvent(ev("evt_1", "customer.subscription.created", now(), sub({ id: "sub_A1", customer: "cus_A1", status: "active" })));
    assert.equal(r, "applied");
    const row = await findSubscriptionByUserId(u);
    assert.equal(row!.status, "active");
    assert.equal(row!.provider_subscription_id, "sub_A1");
    assert.equal(hasStreamerAccess(row), true);
});

test("idempotência: mesmo evento 2x => duplicate, estado intacto", async () => {
    const u = await mkUser();
    await ensureStripeCustomer(u, "cus_B1");
    const e = ev("evt_dup", "customer.subscription.created", now(), sub({ id: "sub_B1", customer: "cus_B1", status: "active" }));
    assert.equal(await handleStripeEvent(e), "applied");
    assert.equal(await handleStripeEvent(e), "duplicate");
    const n = (await pool.query("select count(*)::int c from billing_events where event_id='evt_dup'")).rows[0].c;
    assert.equal(n, 1);
});

test("fora de ordem: evento antigo não sobrescreve o novo", async () => {
    const u = await mkUser();
    await ensureStripeCustomer(u, "cus_C1");
    const t = now();
    // chega primeiro o MAIS NOVO (canceled), depois o antigo (active)
    assert.equal(await handleStripeEvent(ev("evt_c_new", "customer.subscription.updated", t + 10, sub({ id: "sub_C1", customer: "cus_C1", status: "canceled" }))), "applied");
    assert.equal(await handleStripeEvent(ev("evt_c_old", "customer.subscription.updated", t, sub({ id: "sub_C1", customer: "cus_C1", status: "active" }))), "ignored");
    assert.equal((await findSubscriptionByUserId(u))!.status, "canceled");
});

test("perda de acesso rebaixa active_mode para user", async () => {
    const u = await mkUser("streamer");
    await ensureStripeCustomer(u, "cus_D1");
    const t = now();
    await handleStripeEvent(ev("evt_d1", "customer.subscription.created", t, sub({ id: "sub_D1", customer: "cus_D1", status: "active" })));
    assert.equal(await modeOf(u), "streamer", "com assinatura viva mantém o modo");
    await handleStripeEvent(ev("evt_d2", "customer.subscription.deleted", t + 5, sub({ id: "sub_D1", customer: "cus_D1", status: "canceled" })));
    assert.equal(await modeOf(u), "user", "cancelou => volta a user");
});

test("cancel_at_period_end mantém acesso até o fim", async () => {
    const u = await mkUser();
    await ensureStripeCustomer(u, "cus_E1");
    await handleStripeEvent(ev("evt_e1", "customer.subscription.updated", now(), sub({ id: "sub_E1", customer: "cus_E1", status: "active", cancel: true })));
    const row = (await findSubscriptionByUserId(u))!;
    assert.equal(row.cancel_at_period_end, true);
    assert.equal(hasStreamerAccess(row), true);
    assert.equal(await modeOf(u), "streamer");
});

test("assinatura ANTIGA atrasada não derruba a nova", async () => {
    const u = await mkUser();
    await ensureStripeCustomer(u, "cus_F1");
    const t = now();
    await handleStripeEvent(ev("evt_f1", "customer.subscription.created", t, sub({ id: "sub_OLD", customer: "cus_F1", status: "active" })));
    await handleStripeEvent(ev("evt_f2", "customer.subscription.deleted", t + 1, sub({ id: "sub_OLD", customer: "cus_F1", status: "canceled" })));
    // reassina: nova assinatura (aceita porque a anterior está terminal)
    assert.equal(await handleStripeEvent(ev("evt_f3", "customer.subscription.created", t + 2, sub({ id: "sub_NEW", customer: "cus_F1", status: "active" }))), "applied");
    // chega um evento tardio da antiga, com timestamp MAIOR (pior caso)
    assert.equal(await handleStripeEvent(ev("evt_f4", "customer.subscription.updated", t + 3, sub({ id: "sub_OLD", customer: "cus_F1", status: "canceled" }))), "ignored");
    const row = (await findSubscriptionByUserId(u))!;
    assert.equal(row.provider_subscription_id, "sub_NEW");
    assert.equal(row.status, "active");
});

test("customer desconhecido: usa metadata.user_id; sem nada => ignora com 200", async () => {
    const u = await mkUser("user");
    assert.equal(await handleStripeEvent(ev("evt_g1", "customer.subscription.created", now(), sub({ id: "sub_G1", customer: "cus_UNKNOWN", status: "active", meta: { user_id: u } }))), "applied");
    assert.equal((await findSubscriptionByUserId(u))!.provider_customer_id, "cus_UNKNOWN");
    assert.equal(await handleStripeEvent(ev("evt_g2", "customer.subscription.created", now(), sub({ id: "sub_G2", customer: "cus_NOBODY", status: "active" }))), "ignored");
    // metadata maliciosa / inválida não pode virar SQL error nem atribuir a ninguém
    assert.equal(await handleStripeEvent(ev("evt_g3", "customer.subscription.created", now(), sub({ id: "sub_G3", customer: "cus_NOBODY2", status: "active", meta: { user_id: "not-a-uuid'; drop table users;--" } }))), "ignored");
    assert.equal(await handleStripeEvent(ev("evt_g4", "customer.subscription.created", now(), sub({ id: "sub_G4", customer: "cus_NOBODY3", status: "active", meta: { user_id: "00000000-0000-0000-0000-000000000000" } }))), "ignored");
});

test("eventos irrelevantes são ignorados sem gravar", async () => {
    assert.equal(await handleStripeEvent({ id: "evt_h1", type: "invoice.paid", created: now(), data: { object: {} } } as any), "ignored");
    assert.equal((await pool.query("select count(*)::int c from billing_events where event_id='evt_h1'")).rows[0].c, 0);
});

test("falha no meio => rollback: evento NÃO fica registrado e o reenvio funciona", async () => {
    // Falha REAL de banco: dois usuários disputando o mesmo subscription id
    // (índice único) — o INSERT do 2º levanta erro depois do registro do evento.
    const u1 = await mkUser();
    const u2 = await mkUser();
    await ensureStripeCustomer(u1, "cus_I1");
    await ensureStripeCustomer(u2, "cus_I2");
    await handleStripeEvent(ev("evt_i0", "customer.subscription.created", now(), sub({ id: "sub_SHARED", customer: "cus_I1", status: "active" })));

    const clash = ev("evt_i1", "customer.subscription.created", now(), sub({ id: "sub_SHARED", customer: "cus_I2", status: "active" }));
    await assert.rejects(handleStripeEvent(clash), /duplicate key|unique/i);
    assert.equal((await pool.query("select count(*)::int c from billing_events where event_id='evt_i1'")).rows[0].c, 0, "rollback desfez o registro do evento");
    assert.equal((await findSubscriptionByUserId(u2))!.status, "incomplete", "estado do u2 intacto");

    // reenvio do MESMO evento (id igual), agora sem conflito => processa normalmente
    const fixed = ev("evt_i1", "customer.subscription.created", now(), sub({ id: "sub_I2_OK", customer: "cus_I2", status: "active" }));
    assert.equal(await handleStripeEvent(fixed), "applied");
});

test("cortesia manual vencida vira linha Stripe limpa ao criar customer", async () => {
    const u = await mkUser();
    await pool.query("insert into subscriptions (user_id, provider, status, current_period_end) values ($1,'manual','active', now() - interval '10 days')", [u]);
    const before = (await findSubscriptionByUserId(u))!;
    assert.equal(hasStreamerAccess(before), false, "vencida");
    const row = await ensureStripeCustomer(u, "cus_J1");
    assert.equal(row.provider, "stripe");
    assert.equal(row.provider_customer_id, "cus_J1");
    assert.equal(row.status, "incomplete");
    // e um customer já existente NÃO é sobrescrito
    const again = await ensureStripeCustomer(u, "cus_OTHER");
    assert.equal(again.provider_customer_id, "cus_J1");
});
