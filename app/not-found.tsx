export default function NotFound() {
return ( <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6"> <div
             aria-hidden="true"
             className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-[140px]"
         />

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
            <a
                href="/"
                className="mb-10 text-3xl font-semibold tracking-tight transition-opacity duration-200 hover:opacity-80"
            >
                Chatteia
            </a>

            <div
                aria-hidden="true"
                className="select-none text-[clamp(8rem,28vw,14rem)] font-black leading-none tracking-[-0.09em] text-foreground/[0.06]"
            >
                404
            </div>

            <div className="-mt-12">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Página não encontrada
                </h1>

                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                    A página que você tentou acessar não existe ou o
                    endereço informado está incorreto.
                </p>

                <a
                    href="/"
                    className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-pink-500 px-6 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition-all duration-200 hover:bg-pink-400 hover:shadow-pink-500/30 active:scale-[0.98]"
                >
                    Voltar para o início
                </a>
            </div>

            <p className="mt-14 text-xs text-muted-foreground/50">
                Chatteia
            </p>
        </div>
    </main>
);


}
