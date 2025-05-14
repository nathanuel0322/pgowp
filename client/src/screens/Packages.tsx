import "../assets/css/packages.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Img1 from "../assets/images/img1-2.webp";
import Img2 from "../assets/images/img2-2.webp";
import Img3 from "../assets/images/img3-2.webp";
import Img4 from "../assets/images/img4-2.webp";
import Img5 from "../assets/images/img5-2.webp";

export default function Packages() {
    return (
        <div id="packdiv" className="py-5">
            <Container id="listdiv">
                <Row>
                    <Col xs={12}>
                        <div className="title-wrapper">
                            <h2 className="section-title fonts-style display-2">Pricing Packages</h2>
                        </div>
                        <div className="items-wrapper">
                            <div className="item features-image">
                                <div className="item-wrapper">
                                    <div className="item-img">
                                        <img src={Img1} alt="Image 1" />
                                    </div>
                                    <div className="card-box">
                                        <h4 className="item-title fonts-style display-5">2 Hour Video Gaming Party</h4>
                                        <p className="item-text fonts-style display-4">
                                            Enjoy two hours of gaming in our luxurious, climate-controlled trailer with
                                            the latest games, free wristbands, and a special gift for the guest of
                                            honor.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="item features-image">
                                <div className="item-wrapper">
                                    <div className="item-img">
                                        <img src={Img2} alt="Image 2" />
                                    </div>
                                    <div className="card-box">
                                        <h4 className="item-title fonts-style display-5">3 Hour Video Gaming Party</h4>
                                        <p className="item-text fonts-style display-4">
                                            Extend the fun with three hours of gaming in our state-of-the-art trailer,
                                            featuring the latest games, free wristbands, and a memorable experience for
                                            all guests.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="item features-image">
                                <div className="item-wrapper">
                                    <div className="item-img">
                                        <img src={Img3} alt="Image 3" />
                                    </div>
                                    <div className="card-box">
                                        <h4 className="item-title fonts-style display-5">Laser Tag Party!</h4>
                                        <p className="item-text fonts-style display-4">
                                            Experience the thrill of action-packed laser tag with live scoring,
                                            immersive gameplay, and unforgettable fun for all ages!
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="item features-image">
                                <div className="item-wrapper">
                                    <div className="item-img">
                                        <img src={Img5} alt="Image 5" />
                                    </div>
                                    <div className="card-box">
                                        <h4 className="item-title fonts-style display-5">3-Hour Movie Package</h4>
                                        <p className="item-text fonts-style display-4">
                                            Immerse yourself in a cinematic experience with cozy seating and all the
                                            essentials for a perfect movie night. (Contact for More Info){" "}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="item features-image">
                                <div className="item-wrapper">
                                    <div className="item-img">
                                        <img src={Img4} alt="Image 4" />
                                    </div>
                                    <div className="card-box">
                                        <h4 className="item-title fonts-style display-5">PLUS Amenities</h4>
                                        <p className="item-text fonts-style display-4">
                                            Playstation VR!
                                            <br />
                                            Extra Large Connect 4!
                                            <br /> Extra Large Yard Jenga!
                                            <br /> Popcorn Machine!
                                            <br /> Cotton Candy Machine!
                                            <br /> Laser Tag with Live Scoring!
                                            <br /> Karaoke!
                                            <br /> Hot Dog Grill!
                                            <br /> Yard Games!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="mt-5">
                            Please note: All Parties over 4 hours will receive a complimentary plus item after game time
                            is over!
                        </p>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
