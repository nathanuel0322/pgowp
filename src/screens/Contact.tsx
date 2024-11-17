import { useState } from "react";
import "../assets/css/contact.css";
import { apilink, toastError } from "../GlobalFunctions";

export default function Contact() {
    const [formfilled, setFormfilled] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const from_name = (form[0] as HTMLInputElement).value;
        const user_email = (form[1] as HTMLInputElement).value;
        const message = (form[2] as HTMLTextAreaElement).value;
        if (from_name === "" || user_email === "" || message === "") alert("Please fill out all the fields");
        else {
            const formbutton = document.getElementById("sendform") as HTMLInputElement;
            if (formbutton === null) return;
            setSubmitting(true);

            try {
                const res = await fetch(apilink + "/send-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from_name,
                        user_email,
                        message,
                    }),
                });
                if (res.status !== 204) {
                    const data = await res.json();
                    alert(data.message);
                } else setFormfilled(true);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error("Error sending email:", error.message);
                    toastError("Error sending email, please try again later.");
                }
            } finally {
                setSubmitting(false);
            }
        }
    };

    return (
        <div id="contactparentdiv">
            <div id="overlay"></div>
            <div id="contactdiv">
                <p id="contacttext" className="px-4">
                    Click <a href="tel:718-496-1267">here</a> to call or
                    <span> email</span> us using the form below
                </p>
                {formfilled ? (
                    <div className="formfilled">
                        <p>Thank you for your message!</p>
                        <p>We will get back to you as soon as possible.</p>
                    </div>
                ) : (
                    <form className="contactme" id="contactme" onSubmit={sendEmail}>
                        <p className="title">Get in touch</p>
                        <div className="nameemail">
                            <input type="text" name="from_name" placeholder="Name*" className="neinputs" />
                            <input type="email" name="user_email" placeholder="Email*" className="neinputs" />
                        </div>
                        <textarea name="message" placeholder="Message*"></textarea>
                        <input
                            type="submit"
                            value={submitting ? "Sending..." : "SEND"}
                            className="buttoncomp"
                            id="sendform"
                            disabled={submitting}
                            readOnly
                        />
                    </form>
                )}
            </div>
        </div>
    );
}
