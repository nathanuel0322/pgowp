import toast from "react-hot-toast";

export async function toastPromise(promisefunc: Promise<void>, loading: string, success: string) {
    try {
        toast.loading(loading, { duration: Infinity, style: { fontSize: "20px" } });
        await promisefunc;
        toast.dismiss();
        toast.success(success || "Done!", {
            position: "top-center",
            style: {
                background: "#61d345",
                color: "#fff",
                fontSize: "20px",
            },
            iconTheme: {
                primary: "#fff",
                secondary: "#61d345",
            },
        });
    } catch (error: unknown) {
        toast.dismiss();
        if (error instanceof Error) {
            toast.error(error.message || `Something went wrong`, {
                position: "top-center",
                style: {
                    background: "red",
                    color: "#fff",
                    fontSize: "20px",
                },
                iconTheme: {
                    primary: "#fff",
                    secondary: "red",
                },
            });
        } else {
            toast.error(`Something went wrong`, {
                position: "top-center",
                style: {
                    background: "red",
                    color: "#fff",
                    fontSize: "20px",
                },
                iconTheme: {
                    primary: "#fff",
                    secondary: "red",
                },
            });
        }
    }
}
