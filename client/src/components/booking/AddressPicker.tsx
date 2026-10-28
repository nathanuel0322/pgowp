import { useEffect, useId, useRef, useState } from "react";
import { MdCheckCircle, MdErrorOutline } from "react-icons/md";
import { SITE } from "../../site";
import { field } from "./field";

// Party address lookup with Google Places (New) autocomplete. An address only counts once it's picked from Google's
// suggestions: typing clears the pick, and the booking page and worker both require a place id.
// The Maps script is only loaded on pages that render this component.

export interface PickedAddress {
    address: string;
    placeId: string;
}

interface Prediction {
    placeId: string;
    types: string[];
    text: { toString(): string };
    mainText: { toString(): string } | null;
    secondaryText: { toString(): string } | null;
    toPlace(): { fetchFields(options: { fields: string[] }): Promise<unknown>; displayName?: string | null; formattedAddress?: string | null };
}

interface PlacesLibrary {
    AutocompleteSessionToken: new () => object;
    AutocompleteSuggestion: {
        fetchAutocompleteSuggestions(request: Record<string, unknown>): Promise<{ suggestions: { placePrediction: Prediction | null }[] }>;
    };
}

declare global {
    interface Window {
        google?: { maps?: { importLibrary(name: string): Promise<unknown> } };
        gm_authFailure?: () => void;
        pgowpMapsReady?: () => void;
    }
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;
let placesPromise: Promise<PlacesLibrary> | null = null;

function loadPlaces() {
    placesPromise ??= new Promise<PlacesLibrary>((resolve, reject) => {
        if (!MAPS_KEY) return reject(new Error("VITE_GOOGLE_MAPS_KEY isn't set."));
        window.pgowpMapsReady = () => {
            window.google!.maps!.importLibrary("places").then((lib) => resolve(lib as PlacesLibrary), reject);
        };
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&v=weekly&loading=async&callback=pgowpMapsReady`;
        script.async = true;
        script.onerror = () => {
            placesPromise = null;
            reject(new Error("Couldn't load Google Maps."));
        };
        document.head.appendChild(script);
    });
    return placesPromise;
}

// Whole towns, ZIP codes and bare streets aren't a party address.
const AREA_TYPES = /^(locality|sublocality.*|postal_code.*|administrative_area_level_.*|country|neighborhood|colloquial_area|route)$/;
const isAddress = (p: Prediction) => !p.types.some((t) => AREA_TYPES.test(t));

interface Props {
    value: PickedAddress;
    onChange(value: PickedAddress): void;
}

export default function AddressPicker({ value, onChange }: Props) {
    const id = useId();
    const [places, setPlaces] = useState<PlacesLibrary | null>(null);
    const [failed, setFailed] = useState(false);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    // One token per lookup, from the first keystroke to the pick, so Google bills it as one session.
    const session = useRef<object | null>(null);
    // The text the current suggestions are for, so "no match" only shows once Google has answered.
    const [resultsFor, setResultsFor] = useState("");

    useEffect(() => {
        window.gm_authFailure = () => setFailed(true);
        loadPlaces().then(setPlaces, (error) => {
            console.error("Address lookup failed to load:", error);
            setFailed(true);
        });
    }, []);

    const query = value.placeId ? "" : value.address.trim();
    useEffect(() => {
        if (!places || query.length < 3) {
            setPredictions([]);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            session.current ??= new places.AutocompleteSessionToken();
            places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input: query,
                sessionToken: session.current,
                includedRegionCodes: ["us"],
                locationBias: { center: { lat: SITE.geo.latitude, lng: SITE.geo.longitude }, radius: 50000 },
            })
                .then(({ suggestions }) => {
                    if (cancelled) return;
                    setPredictions(suggestions.flatMap((s) => (s.placePrediction && isAddress(s.placePrediction) ? [s.placePrediction] : [])));
                    setResultsFor(query);
                    setActive(-1);
                })
                .catch((error) => {
                    console.error("Address suggestions failed:", error);
                    if (!cancelled) setFailed(true);
                });
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [places, query]);

    const pick = async (prediction: Prediction) => {
        setOpen(false);
        setPredictions([]);
        const place = prediction.toPlace();
        try {
            await place.fetchFields({ fields: ["displayName", "formattedAddress"] });
        } catch (error) {
            console.error("Address details failed:", error);
            setFailed(true);
            return;
        } finally {
            session.current = null;
        }
        const address = place.formattedAddress || prediction.text.toString();
        const name = place.displayName ?? "";
        // Keep a school, church or venue's name in front of its street address.
        onChange({ address: name && !address.startsWith(name) ? `${name}, ${address}` : address, placeId: prediction.placeId });
    };

    const listId = `${id}-list`;
    const showList = open && predictions.length > 0;

    return (
        <div className="relative">
            <input
                id={id}
                required
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
                aria-describedby={`${id}-status`}
                autoComplete="off"
                placeholder="Start typing, then pick your address"
                value={value.address}
                onChange={(e) => {
                    onChange({ address: e.target.value, placeId: "" });
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => {
                    if (!showList) return;
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const step = e.key === "ArrowDown" ? 1 : -1;
                        setActive((i) => (i + step + predictions.length) % predictions.length);
                    } else if (e.key === "Enter" && active >= 0) {
                        e.preventDefault();
                        pick(predictions[active]);
                    } else if (e.key === "Escape") {
                        setOpen(false);
                    }
                }}
                className={field}
            />
            {showList && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-line bg-ink py-1 shadow-xl"
                >
                    {predictions.map((p, i) => (
                        <li
                            key={p.placeId}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            // Keep focus in the input so blur doesn't close the list before the click lands.
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pick(p)}
                            onMouseEnter={() => setActive(i)}
                            className={`cursor-pointer px-4 py-2.5 text-[0.9375rem] font-normal ${i === active ? "bg-gold/10" : ""}`}
                        >
                            <span className="text-white">{(p.mainText ?? p.text).toString()}</span>
                            {p.secondaryText && <span className="ml-2 text-fog">{p.secondaryText.toString()}</span>}
                        </li>
                    ))}
                    <li aria-hidden className="px-4 pb-1.5 pt-1 text-right font-['Roboto',sans-serif] text-xs text-fog/80">
                        Google Maps
                    </li>
                </ul>
            )}
            <p id={`${id}-status`} className="mt-2 flex items-center gap-1.5 text-xs font-normal">
                {failed ? (
                    <span className="text-red-300">
                        <MdErrorOutline className="mr-1 inline" aria-hidden />
                        Address lookup isn't working right now. Please call us at{" "}
                        <a href={SITE.phoneHref} className="underline">
                            {SITE.phone}
                        </a>{" "}
                        to book.
                    </span>
                ) : value.placeId ? (
                    <span className="text-emerald-300">
                        <MdCheckCircle className="mr-1 inline" aria-hidden />
                        Address verified with Google Maps
                    </span>
                ) : (
                    <span className="text-fog">
                        {query && resultsFor === query && !predictions.length
                            ? "No matching address yet. Check the street number and town."
                            : "Pick your address from the Google Maps suggestions to continue."}
                    </span>
                )}
            </p>
        </div>
    );
}
