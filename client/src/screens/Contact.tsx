import { useState } from "react";
import "../assets/css/contact.css";
import { apilink, toastError } from "../GlobalFunctions";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function Contact() {
    // const [formfilled, setFormfilled] = useState(true);
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
        <div id="contact-parent-div" className="!py-5 mt-[15vh]">
            <Container>
                <Row>
                    <Col xs={12}>
                        <div className="card-wrapper">
                            <div className="title-wrapper">
                                <h2 className="title fonts-style display-2">
                                    <strong>Get in touch</strong>
                                </h2>
                                <p className="text fonts-style display-4">
                                    Use the form to send us a message and we'll get back to you as soon as possible.
                                </p>
                            </div>
                            <div className="form form-wrapper" data-form-type="formoid">
                                {formfilled ? (
                                    <div className="formfilled gap-3">
                                        <p className="display-5">Thank you for your message!</p>
                                        <p className="display-4">We will get back to you as soon as possible.</p>
                                    </div>
                                ) : (
                                    <form className="form form-with-styler" onSubmit={sendEmail}>
                                        <Row className="dragArea">
                                            <Col lg={12} md={12} sm={12}>
                                                <h5 className="fonts-style display-7">
                                                    Click{" "}
                                                    <a className="!underline" href="tel:718-496-1267">
                                                        here
                                                    </a>{" "}
                                                    to call or
                                                    <span> email</span> us using the form below
                                                </h5>
                                            </Col>
                                            <Col lg={12} md={12} sm={12} className="form-group">
                                                <input
                                                    type="text"
                                                    name="from_name"
                                                    placeholder="Name*"
                                                    className="neinputs form-control display-7"
                                                />
                                                {/* <input type="text" name="text" placeholder="First name" data-form-field="text" className="" value="" id="text-form01-e"> */}
                                            </Col>
                                            <Col lg={12} md={12} sm={12} className="form-group">
                                                {/* <input type="email" name="email" placeholder="Email address" data-form-field="email" className="form-control display-4" value="" id="email-form01-e"> */}
                                                <input
                                                    type="email"
                                                    name="user_email"
                                                    placeholder="Email*"
                                                    className="neinputs form-control display-7"
                                                />
                                            </Col>
                                            <Col lg={12} md={12} sm={12} className="form-group">
                                                <textarea
                                                    name="textarea"
                                                    placeholder="Message*"
                                                    data-form-field="textarea"
                                                    className="form-control display-7"
                                                    id="textarea-form01-e"
                                                ></textarea>
                                            </Col>
                                            <Col className="section-btn">
                                                <button
                                                    type="submit"
                                                    className="btn btn-secondary display-4"
                                                    disabled={submitting}
                                                >
                                                    {submitting ? "Sending..." : "Send"}
                                                </button>
                                            </Col>
                                        </Row>
                                    </form>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
