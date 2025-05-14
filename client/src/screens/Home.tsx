import { useCallback, useEffect, useRef, useState } from "react";
import "../assets/css/home.css";
import PS5NoBg from "../assets/images/ps5-nobg.png";
import PSVRNoBg from "../assets/images/psvr-nobg.png";
import XboxNoBg from "../assets/images/xbox-nobg.png";
import NintendoNoBg from "../assets/images/nintendo-nobg.png";
import TabletNoBg from "../assets/images/tablet-nobg.png";
import OculusNoBg from "../assets/images/oculus-nobg.png";
import SquarePrestigiousPoster from "../assets/images/square.jpg";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import InfinityTab from "../assets/images/infinitygame.jpeg";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import NicePic from "../assets/images/2024-06-10.jpg";
import Img1 from "../assets/images/img1.jpg";
import Img2 from "../assets/images/img2.jpg";
import Img3 from "../assets/images/img3.jpg";
import Img4 from "../assets/images/img4.jpg";
import Img5 from "../assets/images/img5.jpg";
import Img6 from "../assets/images/img6.jpg";
import Img7 from "../assets/images/img7.jpg";
import Img8 from "../assets/images/img8.jpg";
import Img9 from "../assets/images/img9.jpg";
import Img10 from "../assets/images/img10.jpg";
import Img11 from "../assets/images/img11.jpg";
import Img12 from "../assets/images/img12.jpg";
import Img13 from "../assets/images/img13.jpg";
import Img14 from "../assets/images/img14.jpg";
import Img15 from "../assets/images/img15.jpg";
import Img16 from "../assets/images/img16.jpg";
import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "@react-spring/web";
import { supabase_widgie } from "../supabase_widgie";
import { BiSolidQuoteLeft } from "react-icons/bi";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";

export default function Home() {
    const row1Ref = useRef<HTMLDivElement | null>(null);
    const row2Ref = useRef<HTMLDivElement | null>(null);
    const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true, skipSnaps: true }, [Autoplay({ delay: 2000 })]);
    const [emblaReviewRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [apiLoaded, setApiLoaded] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    // Use react-intersection-observer to track visibility
    const { ref: parentInViewRef, inView: isParentInView } = useInView({ threshold: 0.1 });
    const [scrollTop, setScrollTop] = useState(0);

    // Springs for X t
    const row1Spring = useSpring({
        x: isParentInView ? (window.innerWidth <= 450 ? 0.4 : 0.430556) * scrollTop - 1675 : -900,
        config: { tension: 120, friction: 14 },
    });

    const row2Spring = useSpring({
        x: isParentInView ? (window.innerWidth <= 450 ? -0.4 : -0.430556) * scrollTop + 775 : 0,
        config: { tension: 120, friction: 14 },
    });

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase_widgie
                .from("widgets")
                .select("*")
                .eq("id", "88bfbcb1-5060-4dca-914c-33788e9850c2")
                .single();
            if (error) {
                console.error("Error fetching widget data:", error);
            } else {
                console.log("Widget data:", data);
                setReviews([...data.yelpreviews, ...data.googlereviews]);
                setApiLoaded(true);
            }
        })();
    }, []);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://widgie.pages.dev/review-widget.umd.js";
        // script.src = "../review-widget.js";
        script.async = true;
        script.defer = true;
        // console.log("home outer div", document.getElementById("homeouterdiv"));
        document.getElementById("homeouterdiv")?.appendChild(script);

        const handleScroll = () => {
            setScrollTop(window.scrollY);
            // const scrollTop = window.scrollY;
            // console.log("scrollTop:", scrollTop);
            // beforeinview: scrollTop = 1800, row1Ref: -900px, row2Ref: 0px
            // afterinview: scrollTop = 3600, row1Ref: -125px, row2Ref: -775px
        };

        // Set initial positions for row1Ref and row2Ref
        // if (row1Ref.current) {
        //     row1Ref.current.style.transform = `translate3d(-900px, 0, 0)`; // Default position for row1
        // }
        // if (row2Ref.current) {
        //     row2Ref.current.style.transform = `translate3d(0px, 0, 0)`; // Default position for row2
        // }

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isParentInView]);

    return (
        <div id="homeouterdiv">
            <div
                className="relative fullscreen parallax-background mt-[7.5vh] under769:mt-0"
                id="first-section"
                style={{
                    backgroundImage: `url(${SquarePrestigiousPoster})`,
                    backgroundAttachment: "fixed",
                    backgroundSize: "cover",
                }}
            >
                <Container>
                    <Row className="justify-center">
                        <div className="col-12 col-lg-10">
                            <div className="relative z-[2]">
                                <h2 id="main-title-h2" className="section-title fonts-style display-1">
                                    <strong id="main-title" className="font-bold">
                                        Prestigious Gaming on Wheels Plus
                                    </strong>
                                </h2>
                                <button
                                    className="custom-btn custom-btn-success display-4"
                                    onClick={() =>
                                        document.getElementById("intro-section")?.scrollIntoView({ behavior: "smooth" })
                                    }
                                >
                                    View More
                                </button>
                            </div>
                        </div>
                    </Row>
                </Container>
            </div>
            <div className="py-20">
                <Container>
                    <Row>
                        <div className="col-12">
                            <div>
                                <p className="display-4">Our trailer offers</p>
                                <div className="offer-embla mt-2">
                                    <div
                                        className="embla__viewport cursor-grab overflow-hidden w-full mr-4 h-full"
                                        ref={emblaRef}
                                    >
                                        <div className="embla__container">
                                            <div className="embla__slide">
                                                <img src={PS5NoBg} alt="PS5" />
                                            </div>
                                            <div className="embla__slide">
                                                <img src={PSVRNoBg} alt="PSVR" />
                                            </div>
                                            <div className="embla__slide">
                                                <img src={XboxNoBg} alt="Xbox Series X" />
                                            </div>
                                            <div className="embla__slide">
                                                <img src={NintendoNoBg} alt="Nintendo Switch" />
                                            </div>
                                            <div className="embla__slide">
                                                <img src={TabletNoBg} alt="Tablet" />
                                            </div>
                                            <div className="embla__slide">
                                                <img src={InfinityTab} alt="Infinity" />
                                            </div>
                                            <div className="embla__slide">
                                                <img src={OculusNoBg} alt="Oculus" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Row>
                </Container>
            </div>
            <div id="intro-section" className="relative">
                <Container>
                    <Row className="justify-between">
                        <div className="col-12 col-lg-4 text-start">
                            <div className="title-wrapper">
                                <h2 className="section-title fonts-style display-2">Hey! Hi There! You found us!</h2>
                            </div>
                        </div>
                        <div className="col-12 col-lg-7 text-start">
                            <div className="items-wrapper">
                                <div className="item features-without-image">
                                    <div className="item-wrapper">
                                        <div className="card-box">
                                            <h4 className="item-title fonts-style display-5">Ultimate Entertainment</h4>
                                            <p className="item-text fonts-style display-4">
                                                We are the best gaming/movie trailer experience you will ever encounter
                                                from luxurious quality to the best sounding game/movie trailer on
                                                wheels.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="item features-without-image">
                                    <div className="item-wrapper">
                                        <div className="card-box">
                                            <h4 className="item-title fonts-style display-5">Unforgettable Fun</h4>
                                            <p className="item-text fonts-style display-4">
                                                This is one game trailer you won’t forget. Up to 28 players at once.
                                                Don’t worry, we bring the party to you! Party in any weather, rain or
                                                shine, hot or cold. Come and enjoy your party in our luxury class
                                                trailer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="item features-without-image">
                                    <div className="item-wrapper">
                                        <div className="card-box">
                                            <h4 className="item-title fonts-style display-5">Wide Coverage</h4>
                                            <p className="item-text fonts-style display-4">
                                                We're available to come to you in Brooklyn! Queens! and Parts of Nassau!
                                                For an additional surcharge: Manhattan! Westchester! Suffolk County!
                                                Staten Island! Bronx! Parts of Connecticut! Parts of Nassau! and others!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="item features-without-image">
                                    <div className="item-wrapper">
                                        <div className="card-box">
                                            <h4 className="item-title fonts-style display-5">Event Experts</h4>
                                            <p className="item-text fonts-style display-4">
                                                We do Birthday Parties! Church Functions! School Events! Fundraisers!
                                                Bar Mitzvahs! Bat Mitzvahs! Prom! Block Parties! Charities! and More!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="item features-without-image">
                                    <div className="item-wrapper">
                                        <div className="card-box">
                                            <h4 className="item-title fonts-style display-5">Retro Delight</h4>
                                            <p className="item-text fonts-style display-4">
                                                While kids are having fun on today's systems, parents can enjoy our
                                                retro games: Pac-Man, Donkey Kong, + 1,000 more!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Row>
                </Container>
            </div>
            <div className="py-20">
                <Container>
                    <Row>
                        <div className="col-12 col-lg-6 text-start">
                            <div id="laser-text" className="title-wrapper">
                                <h2 className="section-title fonts-style display-5">
                                    We have the best Hi-Tech Arena Style Equipment, Live On-Screen Scoring, Music, and
                                    Commentating Laser Tag rounds you will ever experience!
                                </h2>
                            </div>
                        </div>
                        <div className="col-12 col-lg-6">
                            <div className="self-center">
                                <iframe
                                    className="embedded-video w-full"
                                    src="https://www.youtube.com/embed/UNcke329oIc?rel=0&amp;amp;mute=1&amp;showinfo=0&amp;autoplay=1&amp;loop=1&playlist=UNcke329oIc"
                                    width="1280"
                                    height="720"
                                    allowFullScreen={true}
                                    style={{ height: "303px" }}
                                ></iframe>
                            </div>
                        </div>
                    </Row>
                </Container>
            </div>
            <div className="py-20" id="mini-gallery" ref={parentInViewRef}>
                <Container fluid className="gallery-wrapper overflow-hidden">
                    <Row className="justify-content-center">
                        <div className="col-12 content-head">
                            <div className="section-head"></div>
                        </div>
                    </Row>
                    <div className="grid-container">
                        <animated.div
                            className="grid-container-1 items-end"
                            ref={row1Ref}
                            style={{ transform: row1Spring.x.to((x) => `translate3d(${x}px, 0, 0)`) }}
                        >
                            <div className="grid-item">
                                <img src={Img1} alt="Image 1" />
                            </div>
                            <div className="grid-item">
                                <img src={Img2} alt="Image 2" />
                            </div>
                            <div className="grid-item">
                                <img src={Img3} alt="Image 3" />
                            </div>
                            <div className="grid-item">
                                <img src={Img4} alt="Image 4" />
                            </div>
                            <div className="grid-item">
                                <img src={Img5} alt="Image 5" />
                            </div>
                            <div className="grid-item">
                                <img src={Img6} alt="Image 6" />
                            </div>
                            <div className="grid-item">
                                <img src={Img7} alt="Image 7" />
                            </div>
                            <div className="grid-item">
                                <img src={Img8} alt="Image 8" />
                            </div>
                        </animated.div>
                        <animated.div
                            className="grid-container-2"
                            ref={row2Ref}
                            style={{ transform: row2Spring.x.to((x) => `translate3d(${x}px, 0, 0)`) }}
                        >
                            <div className="grid-item">
                                <img src={Img9} alt="Image 9" />
                            </div>
                            <div className="grid-item">
                                <img src={Img10} alt="Image 10" />
                            </div>
                            <div className="grid-item">
                                <img src={Img11} alt="Image 11" />
                            </div>
                            <div className="grid-item">
                                <img src={Img12} alt="Image 12" />
                            </div>
                            <div className="grid-item">
                                <img src={Img13} alt="Image 13" />
                            </div>
                            <div className="grid-item">
                                <img src={Img14} alt="Image 14" />
                            </div>
                            <div className="grid-item">
                                <img src={Img15} alt="Image 15" />
                            </div>
                            <div className="grid-item">
                                <img src={Img16} alt="Image 16" />
                            </div>
                        </animated.div>
                    </div>
                </Container>
            </div>
            <div className="py-20 relative">
                <Container>
                    <Row>
                        <Col xs={12}>
                            <div className="card-wrapper">
                                <div className="content-wrapper text-start">
                                    <h2 className="section-title fonts-style display-5 mb-[22px]">
                                        Parking and Connectivity
                                    </h2>
                                    <p className="text fonts-style display-4">
                                        Make sure at least 5 car spaces are saved for trailer parking!
                                        <br />
                                        <br />
                                        if parking is not available within 30 minutes, you will lose your deposit and
                                        your party will be canceled.
                                        <br />
                                        <br />
                                        Due to weak or lack of cell sites in certain areas, it may cause us to have to
                                        connect a line to your router.
                                    </p>
                                    <div className="section-btn">
                                        <a className="custom-btn custom-btn-success display-4" href="tel:7186738529">
                                            Call Now
                                        </a>
                                    </div>
                                </div>
                                <div className="image-wrapper">
                                    <img src={NicePic} alt="Nice Pic" />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
            {/* <div
                id="widgie"
                widget-id="88bfbcb1-5060-4dca-914c-33788e9850c2"
                bg-color="linear-gradient(135deg, rgb(255,165,0) 0%, rgb(134,197,218) 100%)"
            ></div> */}
            {apiLoaded && (
                <div id="client-reviews">
                    <Container>
                        <Row>
                            <Col xs={12}>
                                <div className="title-wrapper">
                                    <h2 className="section-title fonts-style display-2">Client Reviews</h2>
                                </div>
                            </Col>
                            <Col xs={12}>
                                <div className="content-wrapper">
                                    <div className="absolute right-4 flex flex-row gap-3">
                                        <button className="embla__button embla__button--prev" onClick={scrollPrev}>
                                            <span
                                                className="mobi-mbri mobi-mbri-arrow-prev iconfont"
                                                aria-hidden="true"
                                            >
                                                <MdNavigateBefore size={30} />
                                            </span>
                                            <span className="sr-only visually-hidden visually-hidden visually-hidden">
                                                Previous
                                            </span>
                                        </button>
                                        <button className="embla__button embla__button--next" onClick={scrollNext}>
                                            <span
                                                className="mobi-mbri mobi-mbri-arrow-next iconfont"
                                                aria-hidden="true"
                                            >
                                                <MdNavigateNext size={30} />
                                            </span>
                                            <span className="sr-only visually-hidden visually-hidden visually-hidden">
                                                Next
                                            </span>
                                        </button>
                                    </div>
                                    <div
                                        className="review-embla"
                                        data-skip-snaps="true"
                                        data-align="center"
                                        data-contain-scroll="trimSnaps"
                                        data-loop="true"
                                        data-auto-play-interval="2"
                                        data-draggable="true"
                                    >
                                        <div className="embla__viewport is-draggable" ref={emblaReviewRef}>
                                            {/* <div className="embla__container" style="transform: translate3d(-64.4935%, 0px, 0px);"> */}
                                            <div className="embla__container">
                                                {reviews.map((review, index) => (
                                                    <div
                                                        className="embla__slide slider-image item mx-[10px] left-0"
                                                        key={index}
                                                    >
                                                        <div className="slide-content">
                                                            <div className="item-wrapper">
                                                                <div className="item-content">
                                                                    <div className="iconfont-wrapper">
                                                                        <span className="mobi-mbri mobi-mbri-quote-left iconfont">
                                                                            <i className="fas fa-quote-left gradient-icon"></i>
                                                                        </span>
                                                                    </div>
                                                                    <p className="item-text fonts-style display-4 line-clamp-5 mobilel:line-clamp-[11]">
                                                                        {review.reviewtext}
                                                                    </p>
                                                                </div>
                                                                <div className="item-img flex items-center gap-3">
                                                                    <div className="image-wrap">
                                                                        <img
                                                                            src={review.photo}
                                                                            id="topdivimg"
                                                                            style={{
                                                                                borderRadius: review.yelp
                                                                                    ? "2rem"
                                                                                    : "0px",
                                                                                width: review.yelp ? "2.25rem" : "44px",
                                                                                height: review.yelp
                                                                                    ? "2.25rem"
                                                                                    : "44px",
                                                                            }}
                                                                            referrerPolicy="no-referrer"
                                                                            alt=""
                                                                        />
                                                                    </div>
                                                                    <div className="name-wrapper">
                                                                        <p className="item-name fonts-style display-4">
                                                                            <strong>{review.name}</strong>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            )}
        </div>
    );
}
