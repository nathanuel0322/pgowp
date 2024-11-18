import { useContext, useEffect, useState } from "react";
import { MdCalendarMonth, MdChevronLeft, MdChevronRight } from "react-icons/md";
import "../assets/css/checkout.css";
import PuffLoader from "react-spinners/PuffLoader";
import { supabase } from "../supabase";
import { toastError } from "../GlobalFunctions";
import { UUID } from "crypto";
import { AppContext } from "../App";

export interface Party {
    id: UUID;
    created_at: string;
    customer_name: string;
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
    // const [weekParties, setWeekParties] = useState<Party[][]>([]);
    const [isloading, setIsLoading] = useState(true);
    const { cart } = useContext(AppContext);
    const [availableslots, setAvailableSlots] = useState<
        {
            date: Date;
            range: string;
            day_period: string;
        }[]
    >([]);
    const weekParties: Party[][] = Array(7).fill([]);

    console.log("parties:", parties, "\n\ncart:", cart);

    const parseTime = (time: string) => {
        console.log("time is:", time);
        const [timePart, period] = time.split(/(AM|PM)/i);
        let [hours, minutes] = timePart.split(":").map(Number);

        if (period.toUpperCase() === "PM" && hours !== 12) {
            hours += 12;
        } else if (period.toUpperCase() === "AM" && hours === 12) {
            hours = 0;
        }

        return { hours, minutes };
    };

    useEffect(() => {
        if (!cart.length) return;

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
            .or(`start_time.gte.${recentSunday.toISOString()},end_time.lte.${upcomingSaturday.toISOString()}`)
            .then(async ({ data, error }) => {
                if (error) {
                    console.error("Error loading parties:", error);
                    toastError("Error loading calendar, please try again later.");
                    return;
                }
                console.log("parties:", data);
                setParties(data);
                const { data: availdata, error: availerror } = await supabase.from("availability").select("*");
                if (availerror) {
                    console.error("Error loading availability:", availerror);
                    toastError("Error loading calendar, please try again later.");
                    return;
                }
                console.log("availdata:", availdata);

                for (const party of data) {
                    const partyDate = new Date(party.start_time);
                    const dayIndex = partyDate.getDay();
                    if (!weekParties[dayIndex]) {
                        weekParties[dayIndex] = [];
                    }
                    weekParties[dayIndex].push(party);
                }
                console.log("weekParties:", weekParties);

                // Calculate the total time required based on the items in the cart
                const totalTimeRequired = cart.reduce((total, item) => {
                    if (!item.time) return total;
                    const [hours, minutes] = item.time.split(" ").reduce(
                        (acc, part, index, arr) => {
                            // console.log("arr:", arr);
                            if (part.includes("hr")) acc[0] += parseInt(arr[index - 1]);
                            if (part.includes("mins")) acc[1] += parseInt(arr[index - 1]);
                            return acc;
                        },
                        [0, 0]
                    );
                    return total + hours * 60 + minutes;
                }, 0);
                console.log("totalTimeRequired:", totalTimeRequired);

                // morning is 10-12PM, afternoon is 12-5PM, evening is 5-10:30PM

                // after getting when parties are, we need to see which spots are available per day.
                // for example, on fridays, availdata.hours is 1:00PM-10:30PM, so starting from 1PM we need to find slots with 1 hour and a half gap between them, for x hours each
                // if there are parties on the day, subtract the range of the party as well as an hour and a half both ways from its slot
                // if there are no parties, just begin from the start of the day and end at the end of the day

                for (let i = 0; i < 7; i++) {
                    // if the date is in the past, skip it
                    if (dates[i] < today) {
                        console.log("skipping date:", dates[i]);
                        continue;
                    }
                    // day is the date object for this iteration
                    const day = dates[i];

                    // dayavaildata is id, day, and hours for the day of the week
                    const dayAvailData = availdata.find(
                        (avail) => avail.day === day.toLocaleDateString("en-US", { weekday: "long" })
                    );
                    // console.log("dayAvailData:", dayAvailData);

                    // if hours doesnt exist, skip this day
                    if (!dayAvailData?.hours) {
                        // console.log("no hours for day:", day);
                        continue;
                    }

                    // dayStart will be the start of the day
                    const dayStart = new Date(day);
                    const startTime = parseTime(dayAvailData.hours.split(" - ")[0]);
                    dayStart.setHours(startTime.hours);
                    dayStart.setMinutes(startTime.minutes);

                    // dayEnd will be the end of the day
                    const dayEnd = new Date(day);
                    const endTime = parseTime(dayAvailData.hours.split(" - ")[1]);
                    dayEnd.setHours(endTime.hours);
                    dayEnd.setMinutes(endTime.minutes);

                    // dayslots is an array of slots for the day
                    const daySlots: { date: Date; range: string; day_period: string }[] = [];

                    // currentSlotStart and currentSlotEnd will initially be the start of the day
                    let currentSlotStart = new Date(dayStart);
                    let currentSlotEnd = new Date(dayStart);
                    // console.log(
                    //     "initial currentSlotStart:",
                    //     currentSlotStart,
                    //     "\ninitial currentSlotEnd:",
                    //     currentSlotEnd
                    // );

                    // while the current slot end is earlier than the end of the day
                    while (currentSlotEnd < dayEnd) {
                        // store the hours and minutes of the current slot end
                        const currentSlotEndHours = currentSlotEnd.getHours();
                        const currentSlotEndMinutes = currentSlotEnd.getMinutes();

                        // add the total time required to the current slot end to get the next slot end
                        currentSlotEnd.setHours(currentSlotEndHours + Math.floor(totalTimeRequired / 60));
                        currentSlotEnd.setMinutes(currentSlotEndMinutes + (totalTimeRequired % 60));
                        if (currentSlotEnd > dayEnd) {
                            currentSlotEnd = new Date(dayEnd);
                        }

                        // Calculate the duration of the slot
                        const slotDuration = (currentSlotEnd.getTime() - currentSlotStart.getTime()) / (1000 * 60);

                        // Only add the slot if the duration is at least the total time required
                        if (slotDuration >= totalTimeRequired) {
                            const currentSlotRange = `${currentSlotStart.toLocaleTimeString()} - ${currentSlotEnd.toLocaleTimeString()}`;
                            const currentSlotDayPeriod =
                                currentSlotStart.getHours() < 12
                                    ? "morning"
                                    : currentSlotStart.getHours() < 17
                                    ? "afternoon"
                                    : "evening";
                            daySlots.push({
                                date: new Date(currentSlotStart),
                                range: currentSlotRange,
                                day_period: currentSlotDayPeriod,
                            });
                        }

                        // Move currentSlotStart to the end of the current slot plus 1 hour and 30 minutes
                        currentSlotStart = new Date(currentSlotEnd);
                        currentSlotStart.setHours(currentSlotStart.getHours() + 1);
                        currentSlotStart.setMinutes(currentSlotStart.getMinutes() + 30);
                        currentSlotEnd = new Date(currentSlotStart);
                        // console.log("currentSlotStart now:", currentSlotStart, "\ncurrentSlotEnd now:", currentSlotEnd);
                    }
                    console.log("setting available slots to:", [...availableslots, ...daySlots]);
                    setAvailableSlots((prev) => [...prev, ...daySlots]);
                }

                // after loop, calculate available slots for the day
                // for example, if user's cart is 2 hours long, find spaces, with 1 hour gap between other available slots and taken slots, for 2 hours each

                // there are many conditions to consider. It is important to first have the sum of hours for the user's cart

                setIsLoading(false);
            });
    }, [cart]);

    useEffect(() => {
        console.log("available slots set to:", availableslots);
    }, [availableslots]);

    if (isloading) {
        return <PuffLoader color={"#5D87FF"} loading={true} size={150} id="loader" />;
    }

    return (
        <div id="checkout-div">
            <div className="flex justify-between gap-4">
                <div id="inner-slots-div" className="font-[Figtree]">
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
                            {weekDates.map((weekDate, index) => {
                                const istoday = date?.getDate() === weekDate.getDate();
                                return (
                                    <div className="day-view-container text-white" key={index}>
                                        <h2
                                            className={`select-slot-view-day-slots-header ${
                                                istoday ? "!pb-[.13rem]" : ""
                                            }`}
                                        >
                                            <span className="select-slot-week-view-day-slots-header-long">
                                                {weekDate.toLocaleDateString("en-US", { weekday: "long" })}
                                            </span>
                                            <span className="select-slot-week-view-day-slots-header-short">
                                                {weekDate.toLocaleDateString("en-US", { weekday: "short" })}
                                            </span>
                                            <span
                                                className={`select-slot-week-view-day-slots-header-date ${
                                                    date?.getDate() === weekDate.getDate()
                                                        ? "text-[#50E063] select-slot-week-view-day-slots-header-current-date"
                                                        : ""
                                                }`}
                                            >
                                                {weekDate.getDate()}
                                            </span>
                                        </h2>
                                        <ol>
                                            <li>No available slots</li>
                                        </ol>
                                    </div>
                                );
                            })}
                            <a aria-label="Next week" className="select-slot-nav-button">
                                <MdChevronRight />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="booking-details-summary material">
                    <h1 className="summaryHeading">Summary</h1>
                    <div className="booking-details__leftSection___WRazR w-full">
                        <span className="summary-section-title">Booking</span>
                        {cart.map((item, index) => (
                            <span
                                className="summarySectionName booking-details__bookingNameContainer___y25vD w-full flex flex-row items-center justify-between my-[1vh]"
                                key={index}
                            >
                                <span className="summary-section-title">{item.title}</span>
                                <span className="booking-details-price-summary">${item.price}</span>
                            </span>
                        ))}
                    </div>
                    <div className="booking-details-booking-summary">
                        <img
                            src="https://www.rawshorts.com/blog/wp-content/uploads/2019/06/stopwatch-8-gif-download-stopwatch-gif-animation.gif"
                            alt="stopwatch"
                            className="summaryBottomImage"
                        />
                        <h2 className="summaryBottomHeading">Choose Time Slot</h2>
                        <p className="summaryBottomDescription">
                            Select which day and time you would like for your appointment
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
