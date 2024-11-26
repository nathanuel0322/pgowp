import { useContext, useEffect, useRef, useState } from "react";
import "../assets/css/checkoutdetails.css";
import { AppContext } from "../App";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { useLocation } from "react-router-dom";
import Input, { isValidPhoneNumber, type Value } from "react-phone-number-input/input";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import { apilink, toastError, toastPromise } from "../GlobalFunctions";
import validator from "validator";

export default function CheckoutDetails() {
    const location = useLocation();
    const slotinstorage = localStorage.getItem("slot");
    const { slot } = location.state || (slotinstorage ? JSON.parse(slotinstorage) : {});
    const customer_details = localStorage.getItem("customer_details");
    const parsed_customer_details = customer_details ? JSON.parse(customer_details) : null;
    console.log("slot passed to checkout details:", slot);
    const { cart } = useContext(AppContext);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState<Value | undefined>("" as Value);
    const [address, setAddress] = useState("");
    const [showfreeResponse, setShowFreeResponse] = useState(false);
    const [disableAllElements, setDisableAllElements] = useState(false);
    const hasRunRef = useRef(false);
    console.log("cart in checkout details:", cart);

    useEffect(() => {
        if (hasRunRef.current) return;
        hasRunRef.current = true;
        // Check to see if this is a redirect back from Checkout
        const query = new URLSearchParams(location.search);

        if (query.get("success")) {
            // deactivate all clickable elements
            setDisableAllElements(true);
            toastPromise(
                new Promise<void>((resolve, reject) => {
                    // get data from local storage
                    if (parsed_customer_details) {
                        setName(parsed_customer_details.name);
                        setEmail(parsed_customer_details.email);
                        setNumber(parsed_customer_details.number);
                        const addyinput = document.getElementById("searchbar") as HTMLInputElement;
                        addyinput.value = parsed_customer_details.address;
                        setAddress(parsed_customer_details.address);

                        // double check stripe payment was successful
                        fetch(apilink + "/finalize-purchase", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                customer_details: parsed_customer_details,
                                slot,
                                items: cart,
                            }),
                        }).then((res) => {
                            if (res.status === 204) {
                                const { googleLink, yelpLink, wantsGoogle, wantsYelp, title } = parsedWidgetData;
                                const isrRet = await initializeStoreReviews({
                                    googleLink,
                                    yelpLink,
                                    wantsGoogle,
                                    wantsYelp,
                                    plan_type: "premium",
                                    title,
                                    stripe_customer_id: user?.stripe_customer_id as string,
                                    signing_up: true,
                                });
                                if (isrRet) {
                                    resolve();
                                } else {
                                    setDisableAllElements(false);
                                    reject("Error creating widget. Please try again.");
                                }
                            } else {
                                const data = await res.json();
                                console.error("Error verifying purchase:", data);
                                setDisableAllElements(false);
                                reject(`${data.message}. Please try again later.`);
                            }
                        });
                    }
                }),
                "Thank you for signing up for Widgie Premium! We're now processing your widget. Please don't leave this page.",
                "Widget created."
            );
        }

        if (query.get("canceled")) {
            toastError("Order canceled.");
        }
    }, []);

    return (
        <div id="checkout-details-container" className="flex flex-row gap-5">
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
                            disabled={disableAllElements}
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
                            disabled={disableAllElements}
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
                                    disabled={disableAllElements}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="block mb-5">
                    <div id="survey-question-89917-label" className="take-details-label">
                        <p>Please include the full address for the Party</p>
                    </div>
                    <ReactGoogleAutocomplete
                        apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
                        options={{ types: ["address"] }}
                        onPlaceSelected={(place) => {
                            // console.log("place pressed is:", place);
                            if (place) setAddress(place.formatted_address);
                        }}
                        id="searchbar"
                        disabled={disableAllElements}
                    />
                    <button type="button" className="text-red-500 underline" onClick={() => setShowFreeResponse(true)}>
                        Address not showing up? Click here to enter manually
                    </button>
                    {showfreeResponse && (
                        <div className="mt-3">
                            <textarea
                                id="take-details-multiline-survey"
                                required
                                aria-labelledby="survey-question-89917-label"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={disableAllElements}
                            ></textarea>
                        </div>
                    )}
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
                            <button
                                type="button"
                                className="primary bg-[#50e063]"
                                onClick={async () => {
                                    if (!name) {
                                        toastError("Please enter your name before making payment.");
                                        return;
                                    }
                                    if (!email || !validator.isEmail(email)) {
                                        toastError("Please a valid email before making payment.");
                                        return;
                                    }
                                    if (!isValidPhoneNumber(number as string)) {
                                        toastError("Please enter a valid phone number before making payment.");
                                        return;
                                    }
                                    if (!address) {
                                        toastError("Please enter your address before making payment.");
                                        return;
                                    }
                                    try {
                                        const response = await fetch(apilink + "/create-checkout-session", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                                redirect_to: "/checkout-details",
                                                items: cart,
                                                email,
                                            }),
                                        });
                                        const data = await response.json();
                                        console.log("data from create-checkout-session:", data);
                                        if (data.error) {
                                            toastError(data.error.message);
                                            return;
                                        }
                                        // store slot in local storage
                                        localStorage.setItem("slot", JSON.stringify(slot));
                                        localStorage.setItem(
                                            "customer_details",
                                            JSON.stringify({ name, email, number, address })
                                        );
                                        window.location.href = data.url;
                                    } catch (error) {
                                        console.error("error while creating checkout session:", error);
                                        toastError("An error occurred while checking out, please try again later.");
                                    }
                                }}
                            >
                                Make Payment
                            </button>
                            <button type="button" className="secondary bg-[#E5E7EB]">
                                Back
                            </button>
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
                    <div className="flex flex-col gap-1 mt-[2vh]">
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
