import { useEffect, useState } from "react";
import { MdCalendarMonth, MdChevronLeft, MdOutlineLocationOn } from "react-icons/md";
import "../assets/css/checkout.css";

export default function Checkout() {
    const [date, setDate] = useState<Date | null>(null);
    const [weekDates, setWeekDates] = useState<Date[]>([]);

    useEffect(() => {
        const today = new Date();
        setDate(today);

        // Calculate the most recent Sunday
        const recentSunday = new Date(today);
        recentSunday.setDate(today.getDate() - today.getDay());

        // Generate dates for the week starting from the most recent Sunday
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(recentSunday);
            date.setDate(recentSunday.getDate() + i);
            dates.push(date);
        }
        setWeekDates(dates);
    }, []);

    return (
        <div>
            <div className="flex justify-between gap-4">
                <div id="inner-slots-div">
                    <div id="inner-slots-header">
                        <div className="text-center relative">
                            <div className="slot-heading standard-header slot-clickable">
                                <span>{date?.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
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
                                        <li>
                                            <div className="loading__disableSpinner___34o7N select-slot__loading___PpMtU">
                                                <div className="loading__spinnerContainer___3m4aC">
                                                    <img
                                                        alt=""
                                                        src="https://dpt78m53p45fm.cloudfront.net/deep_thought/d54a0e27fcae6f316628d77a02563d0ef599eeb0-gzip/51cda1c8ee3787ddfb8395a335bb650b.svg"
                                                    />
                                                    <p>Loading...</p>
                                                </div>
                                            </div>
                                        </li>
                                    </ol>
                                </div>
                            ))}
                            <div className="day-view-container select-slot__dayInWeek___3Oreh">
                                <h2 className="select-slot__weekViewDaySlotsHeader___rxuJJ weekViewDaySlotHeading">
                                    <span className="select-slot__weekViewDaySlotsHeaderLong___etvZA">Monday</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderShort___1-XC5">Mon</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderDate___2w6W1">11</span>
                                </h2>
                                <ol className="select-slot__slots___2lXNn slotsList">
                                    <li className="select-slot__noAvailableSlots___3QO5R">No available slots</li>
                                    <li>
                                        <div className="loading__disableSpinner___34o7N select-slot__loading___PpMtU">
                                            <div className="loading__spinnerContainer___3m4aC">
                                                <p>Loading...</p>
                                            </div>
                                        </div>
                                    </li>
                                </ol>
                                <div className="error__errorDisplay___l4yhC error__errorDisplayIsBlank___1gaqq select-slot__errorBar___2aNUv">
                                    <p></p>
                                </div>
                            </div>
                            <div className="day-view-container select-slot__dayInWeek___3Oreh">
                                <h2 className="select-slot__weekViewDaySlotsHeader___rxuJJ weekViewDaySlotHeading">
                                    <span className="select-slot__weekViewDaySlotsHeaderLong___etvZA">Tuesday</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderShort___1-XC5">Tue</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderDate___2w6W1">12</span>
                                </h2>
                                <ol className="select-slot__slots___2lXNn slotsList">
                                    <li className="select-slot__noAvailableSlots___3QO5R">No available slots</li>
                                    <li>
                                        <div className="loading__disableSpinner___34o7N select-slot__loading___PpMtU">
                                            <div className="loading__spinnerContainer___3m4aC">
                                                <p>Loading...</p>
                                            </div>
                                        </div>
                                    </li>
                                </ol>
                                <div className="error__errorDisplay___l4yhC error__errorDisplayIsBlank___1gaqq select-slot__errorBar___2aNUv">
                                    <p></p>
                                </div>
                            </div>
                            <div className="day-view-container select-slot__dayInWeek___3Oreh select-slot__wednesday___33qQs">
                                <h2 className="select-slot__weekViewDaySlotsHeader___rxuJJ weekViewDaySlotHeading">
                                    <span className="select-slot__weekViewDaySlotsHeaderLong___etvZA">Wednesday</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderShort___1-XC5">Wed</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderDate___2w6W1">13</span>
                                </h2>
                                <ol className="select-slot__slots___2lXNn slotsList">
                                    <li className="select-slot__noAvailableSlots___3QO5R">No available slots</li>
                                    <li>
                                        <div className="loading__disableSpinner___34o7N select-slot__loading___PpMtU">
                                            <div className="loading__spinnerContainer___3m4aC">
                                                <p>Loading...</p>
                                            </div>
                                        </div>
                                    </li>
                                </ol>
                                <div className="error__errorDisplay___l4yhC error__errorDisplayIsBlank___1gaqq select-slot__errorBar___2aNUv">
                                    <p></p>
                                </div>
                            </div>
                            <div className="day-view-container select-slot__dayInWeek___3Oreh">
                                <h2 className="select-slot__weekViewDaySlotsHeader___rxuJJ weekViewDaySlotHeading">
                                    <span className="select-slot__weekViewDaySlotsHeaderLong___etvZA">Thursday</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderShort___1-XC5">Thu</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderDate___2w6W1">14</span>
                                </h2>
                                <ol className="select-slot__slots___2lXNn slotsList">
                                    <li className="select-slot__noAvailableSlots___3QO5R">No available slots</li>
                                    <li>
                                        <div className="loading__disableSpinner___34o7N select-slot__loading___PpMtU">
                                            <div className="loading__spinnerContainer___3m4aC">
                                                <p>Loading...</p>
                                            </div>
                                        </div>
                                    </li>
                                </ol>
                                <div className="error__errorDisplay___l4yhC error__errorDisplayIsBlank___1gaqq select-slot__errorBar___2aNUv">
                                    <p></p>
                                </div>
                            </div>
                            <div className="day-view-container select-slot__dayInWeek___3Oreh">
                                <h2 className="select-slot__weekViewDaySlotsHeader___rxuJJ weekViewDaySlotHeading">
                                    <span className="select-slot__weekViewDaySlotsHeaderLong___etvZA">Friday</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderShort___1-XC5">Fri</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderDate___2w6W1">15</span>
                                </h2>
                                <ol className="select-slot__slots___2lXNn slotsList">
                                    <section>
                                        <h6 className="select-slot__slotMorningEvening___1hHht">Afternoon</h6>
                                        <li>
                                            <a href="#" className="select-slot__slotLinkBox___2pBq7 material">
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>1:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                                <span className="select-slot__slotSeparator___3b9pP"> - </span>
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>3:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="select-slot__slotLinkBox___2pBq7 material">
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>4:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                                <span className="select-slot__slotSeparator___3b9pP"> - </span>
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>6:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="select-slot__slotLinkBox___2pBq7 material">
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>7:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                                <span className="select-slot__slotSeparator___3b9pP"> - </span>
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>9:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                            </a>
                                        </li>
                                    </section>
                                    <li>
                                        <div className="loading__disableSpinner___34o7N select-slot__loading___PpMtU">
                                            <div className="loading__spinnerContainer___3m4aC">
                                                <p>Loading...</p>
                                            </div>
                                        </div>
                                    </li>
                                </ol>
                                <div className="error__errorDisplay___l4yhC error__errorDisplayIsBlank___1gaqq select-slot__errorBar___2aNUv">
                                    <p></p>
                                </div>
                            </div>
                            <div className="day-view-container select-slot__dayInWeek___3Oreh">
                                <h2 className="select-slot__weekViewDaySlotsHeader___rxuJJ weekViewDaySlotHeading">
                                    <span className="select-slot__weekViewDaySlotsHeaderLong___etvZA">Saturday</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderShort___1-XC5">Sat</span>
                                    <span className="select-slot__weekViewDaySlotsHeaderDate___2w6W1">16</span>
                                </h2>
                                <ol className="select-slot__slots___2lXNn slotsList">
                                    <section>
                                        <h6 className="select-slot__slotMorningEvening___1hHht">Morning</h6>
                                        <li>
                                            <a href="#" className="select-slot__slotLinkBox___2pBq7 material">
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>10:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">AM</span>
                                                </span>
                                                <span className="select-slot__slotSeparator___3b9pP"> - </span>
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>12:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                            </a>
                                        </li>
                                        <h6 className="select-slot__slotMorningEvening___1hHht">Afternoon</h6>
                                        <li>
                                            <a href="#" className="select-slot__slotLinkBox___2pBq7 material">
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>1:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                                <span className="select-slot__slotSeparator___3b9pP"> - </span>
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>3:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" className="select-slot__slotLinkBox___2pBq7 material">
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>4:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                                <span className="select-slot__slotSeparator___3b9pP"> - </span>
                                                <span className="select-slot__slotTimeAndMeridiem___i0TOa">
                                                    <span>6:00</span>
                                                    <span className="select-slot__slotMeridiem___tonF7">PM</span>
                                                </span>
                                            </a>
                                        </li>
                                    </section>
                                    <li>
                                        <div className="loading__disableSpinner___34o7N select-slot__loading___PpMtU">
                                            <div className="loading__spinnerContainer___3m4aC">
                                                <p>Loading...</p>
                                            </div>
                                        </div>
                                    </li>
                                </ol>
                                <div className="error__errorDisplay___l4yhC error__errorDisplayIsBlank___1gaqq select-slot__errorBar___2aNUv">
                                    <p></p>
                                </div>
                            </div>
                            <a aria-label="Next week" className="select-slot-nav-button">
                                <i aria-hidden="true" className="material-icons">
                                    chevron_right
                                </i>
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
