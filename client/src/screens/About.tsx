import GamingContract from "../assets/files/GamingContract.pdf";
import "../assets/css/about.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Accordion from "react-bootstrap/Accordion";
import AccordionContext from "react-bootstrap/AccordionContext";
import { useAccordionButton } from "react-bootstrap/esm/AccordionButton";
import Card from "react-bootstrap/Card";
import { AiOutlinePlus } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useContext } from "react";

const qna = [
    {
        question: "What is Prestigious Gaming on Wheels Plus?",
        answer: `Prestigious Gaming on Wheels Plus is a new family-owned business, run by a tech-savvy family with
            two boys, aged ${calculateAge("2004-03-22")} and ${calculateAge(
            "2009-03-04"
        )}, who love gaming. It provides a luxurious and fun gaming experience for all.`,
    },
    {
        question: "What inspired the creation of this business?",
        answer: "Our family believes that children should have fun and enjoy what they love most, especially when they are doing well in school.",
    },
    {
        question: "What features does the game trailer offer?",
        answer: `The trailer includes 7 indoor 50" 4K TVs, 2 outdoor 50" 4K TVs, a 14' awning, and exterior heat for comfort.`,
    },
    {
        question: "Are there outdoor gaming options available?",
        answer: "Yes, the trailer has 2 outdoor TVs under a 14' awning, perfect for games like Just Dance.",
    },
    {
        question: "What gaming systems are included?",
        answer: "The trailer is equipped with the latest and greatest gaming systems, including Xbox Series X, Playstation 5, and Nintendo Switch.",
    },
    {
        question: "Are there any special features for girls, like Just Dance?",
        answer: "Yes, the trailer includes 2 outdoor TVs with ample space under a 14' awning, perfect for games like Just Dance.",
    },
    {
        question: "Where can I find the terms and conditions?",
        answer: `You can download and view our terms and conditions by clicking
        <a href="${GamingContract}" download="Contract" style="text-decoration: underline; color: rgb(255, 172, 43);">here</a>.`,
    },
    {
        question: "Does Prestigious Gaming on Wheels Plus operate in New Jersey?",
        answer: `For parties in New Jersey, you can check out our sister company, TripleA, by clicking
        <a href="https://www.tripleamobilegaming.com/" target="_blank" rel="noreferrer noopener" id="triplea">here</a>.`,
    },
];

function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function ContextAwareToggle({ children, eventKey }: { children: React.ReactNode; eventKey: string }) {
    const { activeEventKey } = useContext(AccordionContext);

    const decoratedOnClick = useAccordionButton(eventKey);

    const isCurrentEventKey = activeEventKey === eventKey;

    return (
        <button
            type="button"
            className={`panel-title ${isCurrentEventKey ? "" : "collapsed"}`}
            onClick={decoratedOnClick}
        >
            {children}
        </button>
    );
}

export default function About() {
    return (
        <div id="aboutdiv" className="!py-5 mt-[15vh]">
            <Container>
                <Row>
                    <Col xs={12} lg={4}>
                        <div className="content-wrapper">
                            <h2 className="section-title fonts-style display-2">FAQ About Us</h2>
                            <div className="card-wrapper">
                                <div className="card-wrap">
                                    <p className="desc fonts-style display-7">
                                        <strong>Get in touch with us now!</strong>
                                    </p>
                                    <Link to="/contact-us">
                                        <p className="email fonts-style display-4">Contact Us</p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col xs={12} lg={7}>
                        <Accordion className="panel-group accordionStyles" flush>
                            {qna.map((item, index) => (
                                <Card>
                                    <Card.Header>
                                        <ContextAwareToggle eventKey={`${index}`}>
                                            <h4 className="panel-title-edit fonts-style display-7">{item.question}</h4>
                                            <div className="icon-wrapper">
                                                <span className="sign iconfont">
                                                    <AiOutlinePlus size={24} color="white" />
                                                </span>
                                            </div>
                                        </ContextAwareToggle>
                                    </Card.Header>
                                    <Accordion.Collapse eventKey={`${index}`}>
                                        <div className="panel-body">
                                            <p className="panel-text fonts-style display-4">
                                                <span dangerouslySetInnerHTML={{ __html: item.answer }} />
                                            </p>
                                        </div>
                                    </Accordion.Collapse>
                                </Card>
                            ))}
                        </Accordion>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
