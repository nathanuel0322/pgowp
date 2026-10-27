import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { addDays, weekdayOf } from "../../lib/booking";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function shiftMonth(month: string, by: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + by, 1));
    return d.toISOString().slice(0, 7);
}

function monthLabel(month: string) {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
}

// Month grid of YYYY-MM-DD dates. Days without open times are shown but can't be picked.
export default function MonthCalendar({
    month,
    onMonthChange,
    minMonth,
    selected,
    onSelect,
    isOpen,
    loading,
}: {
    month: string;
    onMonthChange(month: string): void;
    minMonth: string;
    selected: string | null;
    onSelect(date: string): void;
    isOpen(date: string): boolean;
    loading?: boolean;
}) {
    const first = `${month}-01`;
    const lead = weekdayOf(first);
    const [y, m] = month.split("-").map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))];

    return (
        <div>
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-full border border-line text-white transition hover:border-white/30 disabled:opacity-30"
                    onClick={() => onMonthChange(shiftMonth(month, -1))}
                    disabled={month <= minMonth}
                    aria-label="Previous month"
                >
                    <MdChevronLeft size={22} />
                </button>
                <p className="font-display text-base font-semibold text-white" aria-live="polite">
                    {monthLabel(month)}
                </p>
                <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-full border border-line text-white transition hover:border-white/30"
                    onClick={() => onMonthChange(shiftMonth(month, 1))}
                    aria-label="Next month"
                >
                    <MdChevronRight size={22} />
                </button>
            </div>
            <div className={`mt-4 grid grid-cols-7 gap-1 text-center transition-opacity ${loading ? "opacity-40" : ""}`}>
                {WEEKDAYS.map((d) => (
                    <span key={d} className="pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-fog">
                        {d}
                    </span>
                ))}
                {cells.map((date, i) => {
                    if (!date) return <span key={`blank-${i}`} />;
                    const open = !loading && isOpen(date);
                    const isSelected = date === selected;
                    return (
                        <button
                            key={date}
                            type="button"
                            disabled={!open}
                            onClick={() => onSelect(date)}
                            aria-pressed={isSelected}
                            aria-label={new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
                                timeZone: "UTC",
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                            })}
                            className={`aspect-square rounded-xl text-sm font-semibold transition ${
                                isSelected
                                    ? "bg-gold text-ink"
                                    : open
                                    ? "bg-white/[0.06] text-white ring-1 ring-line hover:ring-gold/60"
                                    : "text-white/25"
                            }`}
                        >
                            {Number(date.slice(8))}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
