import { MdLocalPhone, MdEmail, MdInfoOutline, MdClose, MdAddShoppingCart } from "react-icons/md";
import { FaSquareInstagram } from "react-icons/fa6";
import "../assets/css/book.css";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../App";

export interface CartItem {
    title: string;
    price?: number;
    time?: string;
    details?: string;
    text?: string;
}

export default function Book({ cartDrawerOpen }: { cartDrawerOpen: boolean }) {
    const { cart, setCart } = useContext(AppContext);
    const [details, setDetails] = useState<{ boxindex: number | null; itemindex: number | null }>({
        boxindex: null,
        itemindex: null,
    });

    console.log("cartDrawerOpen", cartDrawerOpen);

    const [items, setItems] = useState<{ title: string; boxes: CartItem[] }[]>([
        {
            title: "Add Ons",
            boxes: [
                {
                    title: "VR- Virtual Reality- 10 yrs+",
                    price: 80,
                    time: "2 hr",
                    details: `VR- Virtual Reality for ages 10 and up.\n$20 off if booked the same time with party = $80 / $100 on-site`,
                },
                {
                    title: "Add on - Two .15 min laser Tag Session",
                    time: "45 mins",
                    details: `Add On- Fun Fun Fun! Arena style live scoring Laser Tag. Once you have the space, we will setup our obstacles and let the fun begin!! $22 per child for Two .15 min Sessions. Very important - Please keep in mind Weather Permitting. If rain is present, it has to be canceled to protect our Equipment. Thank you`,
                },
                {
                    title: "Photobooth without Prints",
                    price: 100,
                    time: "2 hr",
                    details: `Photobooth usage-take photos with our Photoboot,choose different picture boarders, add sticker. Images to photos and share to your phone or email etc.`,
                },
                {
                    title: 'Photobooth with 2" x 3" Sticker Printouts',
                    price: 125,
                    time: "2 hr",
                    details: `Photobooth usage for duration of party.. (max print outs 15), unlimited digital uploads.`,
                },
                {
                    title: "Karaoke",
                    price: 75,
                    time: "2 hr",
                    details: `Karaoke- 4 mics for duration of party.`,
                },
            ],
        },
        {
            title: "50% GAMING DEPOSITS",
            boxes: [
                {
                    title: "2 Hr. Gaming Party",
                    price: 275,
                    time: "2 hr",
                    details: `Consist of 2 hours of gaming in our Gorgeous New climate controlled Prestigious game trailer. ($550) Package includes all the latest games, FORTNITE at no extra fee, game coaches available to help choose games, change games, etc.. Free wrist bands to all partygoers, a Free Tshirt and gift for the guest of honor. Also up to 25 complimentary cardstock invites on request. Max 24 kids, each additional $10/child.`,
                },
                {
                    title: "3 Hour Gaming Party",
                    price: 350,
                    time: "3 hr",
                    details: `Consist of 3 hours of gaming in our Gorgeous New climate controlled Prestigious game trailer. ($700) Package includes all the latest games, FORTNITE at no extra fee, game coaches available to help choose games, change games, etc.. Free wrist bands to all partygoers, a Free Tshirt and gift for the guest of honor. Also up to 25 complimentary cardstock invites on request. Max 24 kids, each add'l child/$10.`,
                },
                {
                    title: "4 Hour Gaming Party",
                    price: 525,
                    time: "4 hr",
                    details: `Consist of 4 hours of gaming in our Gorgeous New climate controlled Prestigious game trailer. ($1050) Package includes all the latest games, FORTNITE at no extra fee, game coaches available to help choose games, change games, etc.. Free wrist bands to all partygoers, a Free Tshirt and gift for the guest of honor. Also up to 25 complimentary cardstock invites on request.`,
                },
                {
                    title: "Additional Time- Full Amount",
                    price: 150,
                    time: "1 hr",
                    details: `Additional time can be added to your package prior to or during event if available. Each additional/Hr`,
                },
            ],
        },
        {
            title: "CONCESSIONS",
            boxes: [
                {
                    title: "Popcorn Machine",
                    price: 175,
                    time: "1 hr 30 mins",
                    details: `Serving of Popcorn for each party goer.`,
                },
                {
                    title: "Cotton Candy Machine",
                    price: 225,
                    time: "1 hr 30 mins",
                    details: `One Serving of cotton candy for each party goer.`,
                },
                {
                    title: "Sno Cone",
                    price: 125,
                    time: "2 hr",
                },
                {
                    title: "Large Hot Dog Grill",
                    price: 150,
                    time: "4 hr",
                    details: `Use of Hot Dog grill only-Must supply your own Hotdogs.`,
                },
            ],
        },
        {
            title: "Professional Arena Style Laser Tag for up to 18 players",
            boxes: [
                {
                    title: "Add on - Two .15 min laser Tag Session",
                    time: "45 mins",
                    details: `Add On- Fun Fun Fun! Arena style live scoring Laser Tag. Once you have the space, we will setup our obstacles and let the fun begin!! $22 per child for Two .15 min Sessions. Very important - Please keep in mind Weather Permitting. If rain is present, it has to be canceled to protect our Equipment. Thank you`,
                },
                {
                    title: "$200 Deposit required for Stand Alone Laser Tag Party",
                    price: 200,
                    time: "2 hr",
                    details: `1.30 hr of Professional Arena Style Laser Tag $700 for up to 20 kids`,
                },
            ],
        },
        {
            title: "Movie Packages",
            boxes: [
                {
                    title: "Movie and Gaming Combo",
                    price: 437.5,
                    time: "2 hr",
                    details: `Movie Package from above with 2 hr. Of gaming at the end of movie. ($875)`,
                },
                {
                    title: "Movie Party",
                    price: 250,
                    time: "3 hr",
                    details: `Your movie party will consist of 2 hrs of time in the trailer to watch a movie of your choice provided by you on 7 TV screens and the large projector screen. ($500)Movie can be a DVD, blue Ray or streamed from your personal device ex: iPad, tablet, phone etc. you can view movie from all angles. Included with your party will be 1 serving of popcorn and juice pack, along with FreeTshirt for Guest of Honor and bands.`,
                },
            ],
        },
        {
            title: "Jumbo Yard Games",
            boxes: [
                {
                    title: "2 Extra Large Connect 4",
                    price: 145,
                    time: "2 hr",
                    details: `Two Extra Large size Connect 4`,
                },
                {
                    title: "Extra large yard Jenga",
                    price: 60,
                    time: "1 hr 30 mins",
                    details: `Use of Jumbo Jenga yard game,for duration of party.`,
                },
                {
                    title: "Extra Large Connect 4",
                    price: 80,
                    time: "2 hr",
                    details: `Use of Extra Large Connect 4 for duration of Party.`,
                },
            ],
        },
        {
            title: "Schools and Corporate Events",
            boxes: [
                {
                    title: "School Event - 2 Hrs",
                    time: "2 hr",
                    details: `Organized class groups`,
                },
                {
                    title: "School Event - 3 hrs",
                    time: "30 mins",
                    details: `Depends upon the amount of student class rotations.`,
                },
                {
                    title: "School Event - 4 Hrs.",
                    time: "4 hr",
                },
                {
                    title: "5 Hour Gaming Party for School Events",
                    time: "5 hr",
                    details: `5 hrs of Fun Day School events. Includes all yard games,Popcorn, Cotton Candy, and hot Dog grill(only, we do not supply food).`,
                },
                {
                    title: "School Events - 6 Hrs.",
                    time: "30 mins",
                },
                {
                    title: "School Events - 6 Hrs. Of Live scoring Laser Tag",
                    time: "6 hr",
                },
                {
                    title: "Corp. Events - 4 hrs",
                    time: "4 hr",
                    details: `4 hrs of unlimited gaming, VR, Live online scoring Arena style Laser Tag, Popcorn, cotton candy, hot dog grill and yard games.`,
                },
                {
                    title: "Block Party",
                    time: "2 hr",
                    details: `Block Party-Please call for cost. Thanks`,
                },
                {
                    title: "Laser Tag for Events",
                    time: "2 hr",
                    details: `Events - 2 hrs of live Scoring Laser Tag`,
                },
            ],
        },
        {
            title: "ADDITIONAL ADD ONS",
            boxes: [
                {
                    title: "Projector",
                    price: 250,
                    time: "4 hr",
                    details: `Rental use of Projector Only- Delivery fee included. Discount provided with rental of Projector screen. $100 Deposit will be refunded once equipment is returned In good working condition as received.`,
                },
                {
                    title: "Projector & Screen Combo",
                    price: 400,
                    time: "4 hr",
                    details: `Rental Combo for Projector and projector screen with a $150 Deposit will be refunded once equipment is returned In good working condition as received.`,
                },
                {
                    title: "Stage - 4 x 4'",
                    price: 150,
                    time: "4 hr",
                    details: `Stage rental - Add an additional $50 for delivery and pickup. $150 Deposit will be refunded once equipment is returned In good working condition as received.`,
                },
            ],
        },
    ]);

    useEffect(() => {
        if (details.boxindex !== null && details.itemindex !== null)
            setItems((prev) => {
                const newItems = [...prev].map((item) => ({ ...item, boxes: item.boxes.filter((box) => !box.text) }));
                newItems[details.itemindex as number].boxes = [
                    ...prev[details.itemindex as number].boxes.filter((box) => !box.text),
                    {
                        title: newItems[details.itemindex as number].boxes[details.boxindex as number].title,
                        text: prev[details.itemindex as number].boxes[details.boxindex as number].details,
                    },
                ];
                return newItems;
            });
        else setItems((prev) => prev.map((item) => ({ ...item, boxes: item.boxes.filter((box) => !box.text) })));
    }, [details]);

    return (
        <div id="book-div" className="flex flex-col gap-[5vh]">
            <div id="top-book-div" className="flex flex-col items-center gap-[2vw] atleast600:flex-row">
                <img
                    src="https://static-production-10to8.s3.amazonaws.com/CACHE/images/hactar-page/logo/a1feb568-bf58-4411-88b0-dc55d5ba25c7/7432c35e-6c34-4aa9-9ed2-e57b19190940/logo-image/c0ad00783cb0b532862c908453257577.png"
                    alt="Sell Logo"
                    className="w-fit aspect-square object-contain"
                />
                <div>
                    <h1 className="text-black">PRESTIGIOUS GAMING ON WHEELS PLUS!</h1>
                    <div className="flex" id="header-desc">
                        <div className="mr-20 w-full">
                            <a href="tel:7186738529">
                                <span>
                                    <MdLocalPhone />
                                </span>
                                7186738529
                            </a>
                            <a
                                href="mailto:tbnd@prestigiousgamingonwheelsplus.com"
                                target="_top"
                                className="overflow-hidden text-ellipsis"
                            >
                                <span>
                                    <MdEmail />
                                </span>
                                tbnd@prestigiousgamingonwheelsplus.com
                            </a>
                            <a
                                href="https://www.instagram.com/prestigiousgamingonwheelsplus/"
                                title="PRESTIGIOUS GAMING ON WHEELS PLUS! Instagram page."
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                            >
                                <span>
                                    <FaSquareInstagram />
                                </span>
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-transparent flex flex-col gap-4 text-white">
                <h1>About Us</h1>
                <div className="text-base">
                    <p>Where we take Gaming to another level!</p>
                    <p>
                        This booking page does not show full prices for Gaming, Laser Tag and Movie Parties. It only
                        shows you a 50% Deposit fee and $200 Deposit fee for Stand alone Laser Tag due at booking to
                        lock in your date and time slot. Your balance will be due on arrival of your event. Thank you.
                    </p>
                </div>
            </div>
            <div className="bg-transparent flex flex-col gap-4 text-white">
                <h1>Privacy Policy</h1>
                <div className="text-base">
                    <p className="mb-4">It's a must that you provide at least 5 car spaces Thank you. </p>
                    <ul className="list-[circle] list-inside mb-1">
                        <li>Private Party events cost- Covers up to 24 kids. Thank you</li>
                        <li>
                            Additional surcharges outside of Brooklyn, Queens &amp; Nassau depending upon location will
                            be applied.
                        </li>
                        <li>
                            Please note there will be an additional charge for Holiday weekends and more If your event
                            lands on an actual Holiday. Thank you.
                        </li>
                    </ul>
                </div>
            </div>
            <div id="book-services-div" className="text-white text-center">
                <h1>SERVICES</h1>
                <div>
                    {items.map((item, itemindex) => (
                        <div key={itemindex}>
                            <h2>{item.title}</h2>
                            <div>
                                {item.boxes.map((box, boxindex) => {
                                    const isitemincart = cart.some((cartitem) => cartitem.title === box.title);

                                    if (box.text)
                                        return (
                                            <div className="expanded-service-box" key={boxindex}>
                                                <p className="text-xl">{box.title}</p>
                                                <p className="!self-start whitespace-pre-wrap text-left expanded-service-box-text">
                                                    {box.text}
                                                </p>
                                            </div>
                                        );
                                    else {
                                        const gamingPartyTitles = [
                                            "2 Hr. Gaming Party",
                                            "3 Hour Gaming Party",
                                            "4 Hour Gaming Party",
                                        ];

                                        const isGamingPartyInCart = cart.some((cartitem) =>
                                            gamingPartyTitles.includes(cartitem.title)
                                        );
                                        console.log("box:", box, "\nisGamingPartyInCart:", isGamingPartyInCart);
                                        // show hide add cart button if title is Block Party or Additional Time- Full Amount (only show if Gaming Party is in cart)
                                        const shouldShowAddToCartButton =
                                            box.title !== "Block Party" &&
                                            (box.title !== "Additional Time- Full Amount" || isGamingPartyInCart) &&
                                            (!gamingPartyTitles.includes(box.title) ||
                                                !isGamingPartyInCart ||
                                                isitemincart);

                                        return (
                                            <div
                                                style={{
                                                    order:
                                                        boxindex === 0 ||
                                                        (details.boxindex && boxindex <= details.boxindex)
                                                            ? 0
                                                            : 2,
                                                }}
                                                className={`${
                                                    boxindex === details.boxindex && itemindex === details.itemindex
                                                        ? "selected-card"
                                                        : ""
                                                } service-card`}
                                                key={boxindex}
                                            >
                                                <div>
                                                    <div>{box.title}</div>
                                                    {box.price && (
                                                        <span className="service-price">${box.price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                                {box.time && <span>{box.time}</span>}
                                                <div>
                                                    {/* this button will be hidden in the 50% Gaming deposits section if any of the items besides
                                                    "Additional Time- Full Amount" are in the cart */}
                                                    {boxindex === details.boxindex &&
                                                    itemindex === details.itemindex ? (
                                                        <button
                                                            aria-expanded="true"
                                                            type="button"
                                                            onClick={() =>
                                                                setDetails({ boxindex: null, itemindex: null })
                                                            }
                                                        >
                                                            <MdClose />
                                                            Close
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            aria-expanded="false"
                                                            onClick={() => setDetails({ boxindex, itemindex })}
                                                            className={!box.details ? "!hidden" : ""}
                                                        >
                                                            <MdInfoOutline />
                                                            Details
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (isitemincart)
                                                                setCart((prev) =>
                                                                    prev.filter(
                                                                        (cartitem) => cartitem.title !== box.title
                                                                    )
                                                                );
                                                            else setCart((prev) => [...prev, box]);
                                                        }}
                                                        disabled={item.title === "Add Ons" && !isGamingPartyInCart}
                                                        className={`${
                                                            isitemincart ? "!bg-red-700 !text-white" : "bg-[#50e063]"
                                                        } ${shouldShowAddToCartButton ? "" : "!hidden"}`}
                                                    >
                                                        {!isitemincart && <MdAddShoppingCart className="shrink-0" />}
                                                        {item.title === "Add Ons"
                                                            ? // if adds on and gaming party is in cart, show "Add to Cart" button, else show "Must add Gaming Party to Cart"
                                                              isGamingPartyInCart
                                                                ? "Add to Cart"
                                                                : "Must add Gaming Party to Cart"
                                                            : isitemincart
                                                            ? "Remove from Cart"
                                                            : "Add to Cart"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
