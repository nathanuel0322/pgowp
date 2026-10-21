import { ReactNode } from "react";
import "./legacy.css";

export default function BookingLayout({ children }: { children: ReactNode }) {
    return <div className="booking-legacy">{children}</div>;
}
