import { useContext, useEffect, useState } from "react";
import { MdCalendarMonth, MdChevronLeft, MdChevronRight } from "react-icons/md";
import "../assets/css/checkout.css";
import PuffLoader from "react-spinners/PuffLoader";
import { supabase } from "../supabase";
import { toastError } from "../GlobalFunctions";
import { UUID } from "crypto";
import { AppContext } from "../App";
import { Link } from "react-router-dom";
import { Popover } from "@mui/material";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useMediaQuery } from "react-responsive";

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

interface PartySlot {
    date: Date;
    range: string;
    day_period: string;
}

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Checkout() {
    const [weekDates, setWeekDates] = useState<Date[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    //
    // const [weekParties, setWeekParties] = useState<Party[][]>([]);
    const [isloading, setIsLoading] = useState(true);
    const { cart } = useContext(AppContext);
    const [availableslots, setAvailableSlots] = useState<{
        [key: string]: PartySlot[];
    }>({});
    const weekParties: Party[][] = Array(7).fill([]);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const openpopover = Boolean(anchorEl);
    const id = openpopover ? "simple-popover" : undefined;
    const [date, setDate] = useState<Value>(new Date());
    // 833px and under will display mobile display
    const isunder834 = useMediaQuery({ query: "(max-width: 833px)" });
    const [availrows, setAvailRows] = useState<any[]>([]);
    const [slotsofdaymobile, setSlotsofDayMobile] = useState<PartySlot[]>();
    const [mobileslots, setMobileSlots] = useState<{
        morningslots?: PartySlot[];
        afternoonslots?: PartySlot[];
        eveningslots?: PartySlot[];
    }>({});

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday of the current week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to Saturday of the current week

    console.log("parties:", parties, "\n\ncart:", cart);

    const isSameWeek = (date: Date) => {
        return date >= startOfWeek && date <= endOfWeek;
    };

    useEffect(() => {
        console.log("date changed to:", date);
        handleClose();
    }, [date]);

    const handleClose = () => {
        setAnchorEl(null);
    };

    const parseTime = (time: string) => {
        // console.log("time is:", time);
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
        (async () => {
            const { data: availdata, error: availerror } = await supabase.from("availability").select("*");
            if (availerror) {
                console.error("Error loading availability:", availerror);
                toastError("Error loading calendar, please try again later.");
                return;
            }
            // console.log("availdata:", availdata);
            setAvailRows(availdata);
        })();
    }, []);

    useEffect(() => {
        if (!cart.length || !date || !availrows.length) return;
        setAvailableSlots({});

        // Calculate the most recent Sunday
        const recentSunday = new Date(date as Date);
        recentSunday.setDate((date as Date).getDate() - (date as Date).getDay());

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
                // console.log("totalTimeRequired:", totalTimeRequired);

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
                    const dayAvailData = availrows.find(
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
                    const daySlots: PartySlot[] = [];

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
                    console.log("setting available slots to:", {
                        ...availableslots,
                        [day.toLocaleDateString("en-US", { weekday: "long" })]: daySlots,
                    });
                    // setAvailableSlots((prev) => [...prev, ...daySlots]);
                    setAvailableSlots((prev) => ({
                        ...prev,
                        [day.toLocaleDateString("en-US", { weekday: "long" })]: daySlots,
                    }));
                }

                // after loop, calculate available slots for the day
                // for example, if user's cart is 2 hours long, find spaces, with 1 hour gap between other available slots and taken slots, for 2 hours each

                // there are many conditions to consider. It is important to first have the sum of hours for the user's cart
                if (isunder834) {
                    const temp_slotsofdaymobile =
                        availableslots[(date as Date).toLocaleDateString("en-US", { weekday: "long" })];
                    console.log("setting slotsofdaymobile to:", slotsofdaymobile);
                    setSlotsofDayMobile(temp_slotsofdaymobile);
                    // group the slots by time of day, morning, afternoon, evening

                    const { morningslots, afternoonslots, eveningslots } = (temp_slotsofdaymobile || []).reduce(
                        (
                            acc: {
                                morningslots: PartySlot[];
                                afternoonslots: PartySlot[];
                                eveningslots: PartySlot[];
                            },
                            slot
                        ) => {
                            if (slot.day_period === "morning") acc.morningslots.push(slot);
                            if (slot.day_period === "afternoon") acc.afternoonslots.push(slot);
                            if (slot.day_period === "evening") acc.eveningslots.push(slot);
                            return acc;
                        },
                        { morningslots: [], afternoonslots: [], eveningslots: [] }
                    );

                    console.log("setting mobile slots to:", { morningslots, afternoonslots, eveningslots });

                    setMobileSlots({
                        morningslots,
                        afternoonslots,
                        eveningslots,
                    });
                }

                setIsLoading(false);
            });
    }, [cart, date, availrows]);

    useEffect(() => {
        console.log("available slots set to:", availableslots);
    }, [availableslots]);

    if (isloading) {
        return <PuffLoader color={"#5D87FF"} loading={true} size={150} id="loader" />;
    }

    return (
        <div id="checkout-div">
            <div className="flex justify-between gap-4 items-center">
                <div id="inner-slots-div" className="font-[Figtree]">
                    <div id="inner-slots-header">
                        <div className="text-center relative">
                            <div className="slot-heading standard-header slot-clickable">
                                <span className="text-white">
                                    {isunder834
                                        ? (date as Date)?.toLocaleDateString("en-US", {
                                              weekday: "long",
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                          })
                                        : (date as Date)?.toLocaleDateString("en-US", {
                                              month: "long",
                                              year: "numeric",
                                          })}
                                </span>
                                <button
                                    type="button"
                                    name="date-picker"
                                    aria-expanded="false"
                                    className="slot-datepicker-button"
                                    aria-label="Change date"
                                    onClick={(event) => {
                                        setAnchorEl(event.currentTarget);
                                    }}
                                >
                                    <MdCalendarMonth color="#50E063" />
                                </button>
                                <Popover
                                    className=""
                                    id={id}
                                    open={openpopover}
                                    anchorEl={anchorEl}
                                    onClose={handleClose}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "left",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "left",
                                    }}
                                    classes={{ paper: "popoverPaper" }} // Add this line to target the popover with a custom class
                                >
                                    <Calendar onChange={setDate} value={date} minDate={new Date()} />
                                </Popover>
                            </div>
                            <div id="select-header-nav-controls">
                                <button
                                    type="button"
                                    className="select-slot-nav-button secondary"
                                    onClick={() => setDate(new Date())}
                                >
                                    Today
                                </button>
                                <button type="button" className="select-slot-nav-button secondary">
                                    First Slot
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="select-slot-week-view">
                        <div id="select-slot-days-week">
                            {/* if date is in the same week as new Date(), dont allow going back */}
                            {date && !isSameWeek(date as Date) && (
                                <button
                                    title="Previous Week"
                                    className="select-slot-nav-button !rounded-[50%]"
                                    type="button"
                                    onClick={() =>
                                        setDate((prev) => {
                                            const newDate = new Date(prev as Date);
                                            newDate.setDate(newDate.getDate() - 7);
                                            return newDate;
                                        })
                                    }
                                >
                                    <MdChevronLeft />
                                </button>
                            )}
                            {weekDates.map((weekDate, index) => {
                                const istoday =
                                    (date as Date).getDate() === today.getDate() &&
                                    (date as Date).getDate() === weekDate.getDate();
                                const slotsofday =
                                    availableslots[weekDate.toLocaleDateString("en-US", { weekday: "long" })];
                                // group the slots by time of day, morning, afternoon, evening

                                const { morningslots, afternoonslots, eveningslots } = (slotsofday || []).reduce(
                                    (
                                        acc: {
                                            morningslots: PartySlot[];
                                            afternoonslots: PartySlot[];
                                            eveningslots: PartySlot[];
                                        },
                                        slot
                                    ) => {
                                        if (slot.day_period === "morning") acc.morningslots.push(slot);
                                        if (slot.day_period === "afternoon") acc.afternoonslots.push(slot);
                                        if (slot.day_period === "evening") acc.eveningslots.push(slot);
                                        return acc;
                                    },
                                    { morningslots: [], afternoonslots: [], eveningslots: [] }
                                );

                                return (
                                    <div className="day-view-container text-white" key={index}>
                                        <button
                                            type="button"
                                            className={`select-slot-view-day-slots-header w-full ${
                                                istoday && !isunder834 ? "!pb-[.13rem]" : ""
                                            } ${isunder834 ? "" : "mb-2"}`}
                                            // disabled={!isunder834}
                                            onClick={() => setDate(weekDate)}
                                        >
                                            <span
                                                className={`${
                                                    isunder834
                                                        ? "select-slot-week-view-day-slots-header-short"
                                                        : "select-slot-week-view-day-slots-header-long"
                                                }`}
                                            >
                                                {weekDate.toLocaleDateString("en-US", {
                                                    weekday: isunder834 ? "short" : "long",
                                                })}
                                            </span>
                                            <span
                                                className={`select-slot-week-view-day-slots-header-date ${
                                                    istoday
                                                        ? "text-[#50E063] select-slot-week-view-day-slots-header-current-date"
                                                        : ""
                                                }`}
                                            >
                                                {weekDate.getDate()}
                                            </span>
                                        </button>
                                        {!isunder834 && (
                                            <ol>
                                                {slotsofday?.length ? (
                                                    <>
                                                        {morningslots.length > 0 && (
                                                            <SlotSection
                                                                title="Morning"
                                                                slots={morningslots}
                                                                isunder834={isunder834}
                                                            />
                                                        )}
                                                        {afternoonslots.length > 0 && (
                                                            <SlotSection
                                                                title="Afternoon"
                                                                slots={afternoonslots}
                                                                isunder834={isunder834}
                                                            />
                                                        )}
                                                        {eveningslots.length > 0 && (
                                                            <SlotSection
                                                                title="Evening"
                                                                slots={eveningslots}
                                                                isunder834={isunder834}
                                                            />
                                                        )}
                                                    </>
                                                ) : (
                                                    <li className="select-slot-no-available-slots">
                                                        No available slots
                                                    </li>
                                                )}
                                            </ol>
                                        )}
                                    </div>
                                );
                            })}
                            <button
                                title="Next Week"
                                className="select-slot-nav-button !rounded-[50%]"
                                type="button"
                                onClick={() =>
                                    setDate((prev) => {
                                        const newDate = new Date(prev as Date);
                                        newDate.setDate(newDate.getDate() + 7);
                                        return newDate;
                                    })
                                }
                            >
                                <MdChevronRight />
                            </button>
                        </div>
                    </div>
                    {isunder834 && (
                        <ol className="max-h-full">
                            {slotsofdaymobile?.length ? (
                                <>
                                    {mobileslots.morningslots && mobileslots.morningslots.length > 0 && (
                                        <SlotSection
                                            title="Morning"
                                            slots={mobileslots.morningslots}
                                            isunder834={isunder834}
                                        />
                                    )}
                                    {mobileslots.afternoonslots && mobileslots.afternoonslots.length > 0 && (
                                        <SlotSection
                                            title="Afternoon"
                                            slots={mobileslots.afternoonslots}
                                            isunder834={isunder834}
                                        />
                                    )}
                                    {mobileslots.eveningslots && mobileslots.eveningslots.length > 0 && (
                                        <SlotSection
                                            title="Evening"
                                            slots={mobileslots.eveningslots}
                                            isunder834={isunder834}
                                        />
                                    )}
                                </>
                            ) : (
                                <li className="select-slot-no-available-slots select-slot-no-available-slots-mobile">
                                    No available slots
                                </li>
                            )}
                        </ol>
                    )}
                </div>
                <div className="booking-details-summary material h-fit">
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

const SlotSection = ({ title, slots, isunder834 }: { title: string; slots: PartySlot[]; isunder834: boolean }) => (
    <div>
        <h6 className="text-center m-[0.85rem] text-white">{title}</h6>
        <ol>
            {slots.length ? (
                slots.map((slot, index) => {
                    const split_slot = slot.range.split(" - ");
                    const [hours, minutes] = split_slot[0].split(":");
                    const start_time = `${hours}:${minutes}`;
                    const timeofday1 = split_slot[0].split(" ")[1];
                    const [end_hours, end_minutes] = split_slot[1].split(":");
                    const end_time = `${end_hours}:${end_minutes}`;
                    const timeofday2 = split_slot[1].split(" ")[1];

                    return (
                        <li key={index}>
                            <Link
                                to="/checkout-details"
                                state={{ slot }}
                                className={`select-slot-link-box material ${
                                    isunder834 ? "whitespace-nowrap text-2xl" : "whitespace-[initial]"
                                }`}
                            >
                                <span className="select-slot-slot-time">
                                    <span>{start_time}</span>
                                    <span className="select-slot-meridiem">{timeofday1}</span>
                                </span>
                                <span className="select-slot-slot-separator"> - </span>
                                <span className="select-slot-slot-time">
                                    <span>{end_time}</span>
                                    <span className="select-slot-meridiem">{timeofday2}</span>
                                </span>
                            </Link>
                        </li>
                    );
                })
            ) : (
                <li>No available slots</li>
            )}
        </ol>
    </div>
);
