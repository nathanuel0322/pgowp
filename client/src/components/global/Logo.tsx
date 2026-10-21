export default function Logo({ compact = false }: { compact?: boolean }) {
    return (
        <span className="flex items-center gap-3">
            <span
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-linear-to-br from-white/8 to-white/2 font-display text-[15px] font-extrabold tracking-tight shadow-[0_0_24px_-6px_rgba(255,176,46,0.5)]"
            >
                <span>
                    <span className="text-volt-soft">P</span>
                    <span className="text-gold">G</span>
                </span>
            </span>
            {!compact && (
                <span className="flex flex-col leading-none">
                    <span className="font-display text-[13px] font-bold tracking-tight text-white sm:text-sm">
                        Prestigious Gaming
                    </span>
                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fog">
                        on Wheels <span className="text-gold">Plus</span>
                    </span>
                </span>
            )}
        </span>
    );
}
