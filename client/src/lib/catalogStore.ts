import { useEffect, useSyncExternalStore } from "react";
import { apilink } from "../GlobalFunctions";
import { DEFAULT_CATALOG, catalogFrom, type Catalog } from "./catalog";

// The price list every page shows. The build bakes the live one into each page as window.__CATALOG__ (see
// entry-server.tsx), so the first render matches the prerendered HTML. Pages then fetch it again once, which picks up
// anything a manager changed since the last deploy.

declare global {
    interface Window {
        __CATALOG__?: unknown;
    }
}

let current: Catalog = typeof window !== "undefined" && window.__CATALOG__ ? catalogFrom(window.__CATALOG__) : DEFAULT_CATALOG;
const listeners = new Set<() => void>();
let fetched = false;

export const getCatalog = () => current;

export function setCatalog(next: Catalog) {
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    current = next;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export async function refreshCatalog() {
    fetched = true;
    try {
        const res = await fetch(`${apilink}/booking/catalog`);
        if (res.ok) setCatalog(catalogFrom((await res.json()).catalog));
    } catch {
        /* offline or the API is down: keep showing the prices already on the page */
    }
}

export function useCatalog() {
    const catalog = useSyncExternalStore(subscribe, getCatalog, getCatalog);
    useEffect(() => {
        if (!fetched) refreshCatalog();
    }, []);
    return catalog;
}
