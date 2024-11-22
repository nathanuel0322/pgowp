import { useContext, useState } from "react";
import "../assets/css/checkoutdetails.css";
import { AppContext } from "../App";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { useLocation } from "react-router-dom";
import Input, { type Value } from "react-phone-number-input/input";

export default function CheckoutDetails() {
    const location = useLocation();
    const { slot } = location.state || {};
    console.log("slot passed to checkout details:", slot);
    const { cart } = useContext(AppContext);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState<Value | undefined>("" as Value);
    const [address, setAddress] = useState("");

    return (
        <div className="flex flex-row gap-5">
            <div id="take-details-box" className="text-white">
                <div id="take-details-div" className="detailContainer">
                    <label htmlFor="name" className="take-details-label">
                        Full Name
                    </label>
                    <div>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="take-take-details-inputs"
                            placeholder="Enter full name"
                        />
                    </div>
                    <label htmlFor="email" className="take-details-label">
                        Email
                    </label>
                    <div>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="take-take-details-inputs"
                            placeholder="Enter email address"
                        />
                    </div>
                    <label htmlFor="number" id="number" className="take-details-label">
                        Contact Number
                    </label>
                    <div>
                        <div className="react-phone-number-input mb-2">
                            <div className="flex items-center">
                                <Input
                                    value={number}
                                    onChange={(e) => setNumber(e)}
                                    country="US"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="block mb-5">
                    <div id="survey-question-89917-label" className="take-details-label">
                        <p>Please include the full address for the Party</p>
                    </div>
                    <div>
                        <textarea
                            id="take-details-multiline-survey"
                            required
                            aria-labelledby="survey-question-89917-label"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        ></textarea>
                    </div>
                </div>
                <div className="my-5 text-justify">
                    <h4 className="font-bold mb-2 pt-[0.3rem]">Cancellation Policy</h4>
                    <div>
                        <p>
                            We have a 48 hour cancellation policy. If you miss your appointment, or cancel with less
                            than 48 hours notice, your deposit is non refundable.
                        </p>
                    </div>
                </div>
                <div id="take-details-btn-container" className="mt-4 mb-1 text-center">
                    <div className="flex items-center flex-col">
                        <div id="take-details-btns-wrapper">
                            <button className="primary">Make Payment</button>
                            <button className="secondary">Back</button>
                        </div>
                    </div>
                </div>
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
                            {item.price && <span className="booking-details-price-summary">${item.price}</span>}
                        </span>
                    ))}
                    <div className="booking-details__leftSection___WRazR">
                        <span className="summarySectionTitle">
                            <MdOutlineCalendarMonth />
                            When
                        </span>
                        <span className="summarySectionName">{slot.range}</span>
                        <span className="summarySectionDetail">
                            {slot.date.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
