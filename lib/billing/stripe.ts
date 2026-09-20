import Stripe from "stripe";

export class BillingNotConfiguredError extends Error {
    constructor() {
        super("STRIPE_SECRET_KEY não configurado.");
        this.name = "BillingNotConfiguredError";
    }
}

const globalForStripe = globalThis as unknown as {
    __chatteiaStripe?: Stripe;
};

/**
 * Cliente Stripe criado sob demanda (lazy): o build do Next e ambientes sem
 * Stripe configurado não quebram por falta da chave.
 *
 * Não fixamos `apiVersion`: o SDK usa a versão da API contra a qual foi
 * tipado, então tipos e respostas andam juntos ao atualizar o pacote.
 */
export function getStripe(): Stripe {
    if (globalForStripe.__chatteiaStripe) {
        return globalForStripe.__chatteiaStripe;
    }

    const key = process.env.STRIPE_SECRET_KEY?.trim();

    if (!key) {
        throw new BillingNotConfiguredError();
    }

    const client = new Stripe(key, {
        maxNetworkRetries: 2,
        timeout: 15_000,
        appInfo: { name: "Chatteia" },
    });

    globalForStripe.__chatteiaStripe = client;

    return client;
}
