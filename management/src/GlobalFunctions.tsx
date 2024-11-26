import toast, { ToastPosition } from "react-hot-toast";

export const apilink = import.meta.env.DEV
    ? "http://127.0.0.1:8787/api"
    : "https://prestigiousgamingonwheelsplus.com/api";

const successStyle = {
    position: "top-center" as ToastPosition,
    style: {
        background: "#61d345",
        color: "#fff",
    },
    iconTheme: {
        primary: "#fff",
        secondary: "#61d345",
    },
};

const errorStyle = {
    position: "top-center" as ToastPosition,
    style: {
        background: "red",
        color: "#fff",
    },
    iconTheme: {
        primary: "#fff",
        secondary: "red",
    },
};

export function toastSuccess(message: string) {
    toast.success(message, successStyle);
}

export function toastError(message: string) {
    toast.error(message, errorStyle);
}

export async function toastPromise<T>(
    promisefunc: Promise<T>,
    loading: string,
    success: string | ((data: T) => string),
    duration?: number
) {
    try {
        toast.loading(loading, { duration: Infinity });
        const data = await promisefunc;
        toast.dismiss();
        const successMessage = typeof success === "function" ? success(data) : success;
        toast.success(successMessage || "Done!", { ...successStyle, duration: duration || 2000 });
    } catch (error: unknown) {
        toast.dismiss();
        if (typeof error === "string") {
            toast.error(error, { ...errorStyle, duration: duration || 2000 });
        } else if (error instanceof Error) {
            toast.error(error.message || `Something went wrong`, { ...errorStyle, duration: duration || 2000 });
        } else {
            toast.error(`Something went wrong`, { ...errorStyle, duration: duration || 2000 });
        }
    }
}
