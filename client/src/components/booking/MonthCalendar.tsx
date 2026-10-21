import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { addDays, formatDate, weekdayOf } from "../../booking/time";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function shiftMonth(month: string, by: number) {
    const [y, m] = month.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1 + by, 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

// A month grid where only dates with open times can be picked.
export default function MonthCalendar({
    month,
    open,
    selected,
    loading,
    minMonth,
    maxMonth,
    onSelect,
    onMonthChange,
}: {
    month: string;
    open: Set<string>;
    selected: string | null;
    loading: boolean;
    minMonth: string;
    maxMonth: string;
    onSelect(date: string): void;
    onMonthChange(month: string): void;
}) {
    const first = `${month}-01`;
    const cells: (string | null)[] = Array(weekdayOf(first)).fill(null);
    for (let d = first; d.startsWith(month); d = addDays(d, 1)) cells.push(d);

    return (
        <div>
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-full border border-line text-white transition hover:border-gold/50 disabled:opacity-30"
                    onClick={() => onMonthChange(shiftMonth(month, -1))}
                    disabled={month <= minMonth}
                    aria-label="Previous month"
                >
                    <MdChevronLeft size={22} />
                </button>
                <p className="font-display text-lg font-semibold text-white" aria-live="polite">
                    {formatDate(first, { weekday: undefined, day: undefined })}
                </p>
                <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-full border border-line text-white transition hover:border-gold/50 disabled:opacity-30"
                    onClick={() => onMonthChange(shiftMonth(month, 1))}
                    disabled={month >= maxMonth}
                    aria-label="Next month"
                >
                    <MdChevronRight size={22} />
                </button>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1.5 text-center" role="grid" aria-busy={loading}>
                {WEEKDAYS.map((w) => (
                    <div key={w} className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-fog">
                        {w}
                    </div>
                ))}
                {cells.map((date, i) =>
                    date ? (
                        <button
                            key={date}
                            type="button"
                            disabled={!open.has(date)}
                            onClick={() => onSelect(date)}
                            aria-pressed={selected === date}
                            aria-label={formatDate(date)}
                            className={`aspect-square rounded-xl text-sm font-bold transition sm:text-[15px] ${
                                selected === date
                                    ? "bg-gold text-ink"
                                    : open.has(date)
                                      ? "border border-gold/30 bg-gold/10 text-white hover:border-gold hover:bg-gold/20"
                                      : "text-white/25"
                            } ${loading ? "animate-pulse" : ""}`}
                        >
                            {Number(date.slice(8))}
                        </button>
                    ) : (
                        <div key={`blank-${i}`} />
                    )
                )}
            </div>
        </div>
    );
}
