import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile spam check. The script is only loaded on pages that render this component.
interface TurnstileApi {
    render(container: HTMLElement, options: Record<string, unknown>): string;
    reset(widgetId: string): void;
    remove(widgetId: string): void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing")));
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error("Couldn't load the spam check."));
        };
        document.head.appendChild(script);
    });
    return scriptPromise;
}

export interface TurnstileHandle {
    reset(): void;
}

interface Props {
    siteKey: string;
    action: string;
    onToken(token: string | null): void;
    onError?(): void;
}

const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ siteKey, action, onToken, onError }, ref) {
    const container = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    // Keep the latest callbacks without re-rendering the widget when the parent re-renders.
    const callbacks = useRef({ onToken, onError });
    callbacks.current = { onToken, onError };

    useImperativeHandle(ref, () => ({
        reset() {
            callbacks.current.onToken(null);
            if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
        },
    }));

    useEffect(() => {
        let cancelled = false;
        loadTurnstile()
            .then((turnstile) => {
                if (cancelled || !container.current) return;
                widgetId.current = turnstile.render(container.current, {
                    sitekey: siteKey,
                    action,
                    theme: "dark",
                    size: "flexible",
                    callback: (token: string) => callbacks.current.onToken(token),
                    "expired-callback": () => callbacks.current.onToken(null),
                    "error-callback": () => {
                        callbacks.current.onToken(null);
                        callbacks.current.onError?.();
                    },
                });
            })
            .catch(() => callbacks.current.onError?.());
        return () => {
            cancelled = true;
            if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
            widgetId.current = null;
        };
    }, [siteKey, action]);

    // Reserve the widget's height so the button doesn't jump when it appears.
    return <div ref={container} className="min-h-[65px]" />;
});

export default Turnstile;
