import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "../assets/css/services.css";
import Img1 from "../assets/images/img1-1.webp";
import Img2 from "../assets/images/img2-1.webp";
import Img3 from "../assets/images/img3-1.webp";

export default function Services() {
    return (
        <div id="coaches" className="py-20 !text-white under769:py-0">
            <Container className="mt-[5vh]">
                <Row>
                    <Col xs={12}>
                        <div className="title-wrapper">
                            <h2 className="section-title fonts-style display-2">Game Coaches</h2>
                        </div>
                    </Col>
                </Row>
                <Row className="items-wrapper text-left">
                    <Col xs={12} lg={4} className="item features-image">
                        <div className="item-wrapper card_1">
                            <div className="item-img">
                                <img src={Img3} alt="Image 3" />
                            </div>
                            <div className="card-box">
                                <h4 className="item-title fonts-style display-5">Game Guidance</h4>
                                <p className="item-text fonts-style display-4">
                                    Our Game Coaches are there to help, instruct, or even play with our guests! They are
                                    also present in order to ensure all the kids are having a great time while under our
                                    roof!
                                </p>
                            </div>
                        </div>
                    </Col>
                    <Col xs={12} lg={4} className="item features-image">
                        <div className="item-wrapper card_2">
                            <div className="item-img">
                                <img src={Img1} alt="Image 1" />
                            </div>
                            <div className="card-box">
                                <h4 className="item-title fonts-style display-5">Tech Amenities</h4>
                                <p className="item-text fonts-style display-4">
                                    Charging Station for all your Cell Phone Needs, Along with Soundbars for each TV,
                                    and a Stand-alone VR section.
                                </p>
                            </div>
                        </div>
                    </Col>
                    <Col xs={12} lg={4} className="item features-image">
                        <div className="item-wrapper card_3">
                            <div className="item-img">
                                <img src={Img2} alt="Image 2" />
                            </div>
                            <div className="card-box">
                                <h4 className="item-title fonts-style display-5">Event Celebration</h4>
                                <p className="item-text fonts-style display-4">
                                    This trailer is definitely where you want to celebrate your next function, and take
                                    pictures with GORGEOUS backgrounds. Included with your package, you'll receive up to
                                    30 invites per booking, or an electronic option.
                                </p>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
