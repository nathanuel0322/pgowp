import { useEffect, useState } from "react";
import { MdCalendarMonth, MdChevronLeft, MdChevronRight, MdOutlineLocationOn } from "react-icons/md";
import "../assets/css/checkout.css";
import PuffLoader from "react-spinners/PuffLoader";
import { supabase } from "../supabase";
import { toastError } from "../GlobalFunctions";
import { UUID } from "crypto";

export interface Party {
    id: UUID;
    created_at: string;
    customer_name: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    customer_email: string;
    customer_phone: string;
}

export default function Checkout() {
    const [date, setDate] = useState<Date | null>(null);
    const [weekDates, setWeekDates] = useState<Date[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    //
    const weekParties: Party[][] = [];
    // const [weekParties, setWeekParties] = useState<Party[][]>([]);
    const [isloading, setIsLoading] = useState(true);

    console.log("parties:", parties);

    useEffect(() => {
        const today = new Date();
        setDate(today);

        // Calculate the most recent Sunday
        const recentSunday = new Date(today);
        recentSunday.setDate(today.getDate() - today.getDay());

        // Calculate the upcoming Saturday
        const upcomingSaturday = new Date(recentSunday);
        upcomingSaturday.setDate(recentSunday.getDate() + 6);

        // Generate dates for the week starting from the most recent Sunday
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(recentSunday);
            date.setDate(recentSunday.getDate() + i);
            dates.push(date);
        }
        setWeekDates(dates);

        supabase
            .from("parties")
            .select("*")
            .gte("date", recentSunday.toISOString())
            .lte("date", upcomingSaturday.toISOString())
            .then(({ data, error }) => {
                if (error) {
                    console.error("Error loading parties:", error);
                    toastError("Error loading calendar, please try again later.");
                    return;
                }
                console.log("parties:", data);
                setParties(data);
                // morning is 10-12PM, afternoon is 12-5PM, evening is 5-10:30PM
                // separate the parties into morning, afternoon, and evening, for each day
                for (const party of data) {
                    const partyDate = new Date(party.date);
                    const dayIndex = partyDate.getDay();
                    const dayParties = weekParties[dayIndex];
                    if (!dayParties) {
                        weekParties[dayIndex] = [];
                    }
                    weekParties[dayIndex].push(party);
                }
                // after loop, calculate available slots for the day
                // for example, if user's cart is 2 hours long, find spaces, with 1 hour gap between other available slots and taken slots, for 2 hours each

                // there are many conditions to consider. It is important to first have the sum of hours for the user's cart

                setIsLoading(false);
            });
    }, []);

    if (isloading) {
        return <PuffLoader color={"#5D87FF"} loading={true} size={150} id="loader" />;
    }

    return (
        <div id="checkout-div">
            <div className="flex justify-between gap-4">
                <div id="inner-slots-div">
                    <div id="inner-slots-header">
                        <div className="text-center relative">
                            <div className="slot-heading standard-header slot-clickable">
                                <span className="text-white">
                                    {date?.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                                <button
                                    name="date-picker"
                                    aria-expanded="false"
                                    className="slot-datepicker-button"
                                    aria-label="Change date"
                                >
                                    <MdCalendarMonth color="#50E063" />
                                </button>
                            </div>
                            <div id="select-header-nav-controls">
                                <button className="select-slot-nav-button secondary">Today</button>
                                <button className="select-slot-nav-button secondary">First Slot</button>
                            </div>
                        </div>
                    </div>
                    <div id="select-slot-week-view">
                        <div id="select-slot-days-week">
                            <a aria-label="Previous week" className="select-slot-nav-button">
                                <MdChevronLeft />
                            </a>
                            {weekDates.map((weekDate, index) => (
                                <div className="day-view-container" key={index}>
                                    <h2 className="select-slot-view-day-slots-header">
                                        <span className="select-slot-week-view-day-slots-header-long">
                                            {weekDate.toLocaleDateString("en-US", { weekday: "long" })}
                                        </span>
                                        <span className="select-slot-week-view-day-slots-header-short">
                                            {weekDate.toLocaleDateString("en-US", { weekday: "short" })}
                                        </span>
                                        <span className="select-slot-week-view-day-slots-header-date">
                                            {weekDate.getDate()}
                                        </span>
                                    </h2>
                                    <ol>
                                        <li>No available slots</li>
                                    </ol>
                                </div>
                            ))}
                            <a aria-label="Next week" className="select-slot-nav-button">
                                <MdChevronRight />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="booking-details__bookingSummary___Y4BLR material">
                    <h1 className="summaryHeading">Summary</h1>
                    <div className="booking-details__bookingDetails___2sufv">
                        <div className="booking-details__sectionContainer___3esWd">
                            <div className="booking-details__leftSection___WRazR">
                                <span className="summarySectionTitle">Booking</span>
                                <span className="summarySectionName booking-details__bookingNameContainer___y25vD">
                                    <span>2 Hr. Gaming Party</span>
                                    <span className="booking-details__mobileSummarySectionContent___3JwCH">$275</span>
                                </span>
                                <span className="summarySectionDetail">2 hr</span>
                            </div>
                        </div>
                        <div className="booking-details__sectionContainer___3esWd">
                            <div className="booking-details__leftSection___WRazR">
                                <span className="summarySectionTitle">
                                    <MdOutlineLocationOn />
                                    Location
                                </span>
                                <span className="summarySectionName">Online / Phone</span>
                            </div>
                        </div>
                    </div>
                    <div className="booking-details__bookingSummaryBottomSection___3conc">
                        <div>
                            <h2 className="summaryBottomHeading">Choose Time Slot</h2>
                            <p className="summaryBottomDescription">
                                Select which day and time you would like for your appointment
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
