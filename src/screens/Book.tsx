import { MdLanguage, MdLocalPhone, MdEmail, MdSchedule, MdInfoOutline } from "react-icons/md";
import { FaSquareInstagram } from "react-icons/fa6";
import "../assets/css/book.css";

export default function Book() {
    return (
        <div id="book-div" className="flex flex-col gap-[5vh]">
            <div id="top-book-div" className="flex flex-row items-center gap-[2vw]">
                <img
                    src="https://static-production-10to8.s3.amazonaws.com/CACHE/images/hactar-page/logo/a1feb568-bf58-4411-88b0-dc55d5ba25c7/7432c35e-6c34-4aa9-9ed2-e57b19190940/logo-image/c0ad00783cb0b532862c908453257577.png"
                    alt="Sell Logo"
                    className="w-fit aspect-square object-contain"
                />
                <div>
                    <h1 className="font-bold text-black">PRESTIGIOUS GAMING ON WHEELS PLUS!</h1>
                    <div className="flex" id="header-desc">
                        <div className="mr-20">
                            <a href="http://Prestigiousgamingonwheelsplus.com" rel="nofollow">
                                <span>
                                    <MdLanguage />
                                </span>
                                http://Prestigiousgamingonwheelsplus.com
                            </a>
                            <a href="tel:7186738529">
                                <span>
                                    <MdLocalPhone />
                                </span>
                                7186738529
                            </a>
                            <a href="mailto:tbnd@prestigiousgamingonwheelsplus.com" target="_top">
                                <span>
                                    <MdEmail />
                                </span>
                                tbnd@prestigiousgamingonwheelsplus.com
                            </a>
                        </div>
                        <div>
                            <a
                                href="https://www.instagram.com/prestigious Gaming On Wheels Plus"
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
                <div className=" text-[2vw]">
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
                <div className=" text-[2vw]">
                    <p>It's a must that you provide at least 5 car spaces Thank you. </p>
                    <ul className="list-[circle] list-inside mb-1">
                        <li>
                            <p>Private Party events cost- Covers up to 24 kids. Thank you</p>
                        </li>
                        <li>
                            <p>
                                Additional surcharges outside of Brooklyn, Queens &amp; Nassau depending upon location
                                will be applied.
                            </p>
                        </li>
                        <li>
                            <p>
                                Please note there will be an additional charge for Holiday weekends and more If your
                                event lands on an actual Holiday. Thank you.
                            </p>
                        </li>
                    </ul>
                </div>
            </div>
            <div id="book-services-div" className="text-white text-center">
                <h1>SERVICES</h1>
                <div>
                    <div>
                        <h2>Add Ons</h2>
                        <div>
                            <div>
                                <div>
                                    <div>VR- Virtual Reality- 10 yrs +</div>
                                    <span className="service-price">$80</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Add on - Two .15 min laser Tag Session</div>
                                </div>
                                <span>45 mins</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Photobooth without Prints</div>
                                    <span className="service-price">$100</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Photobooth with 2" x 3" Sticker Printouts</div>
                                    <span className="service-price">$125</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Karaoke</div>
                                    <span className="service-price">$75</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>School Event - 4 Hrs.</div>
                                </div>
                                <span>4 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button
                                        aria-expanded="false"
                                        className="secondary select-service__serviceShowDetailsButton___30UxJ select-service__hideButton___ooxLV"
                                    >
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Block Party</div>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Laser Tag for Events</div>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 id="50%  GAMING DEPOSITS">50% GAMING DEPOSITS</h2>
                        <div>
                            <div>
                                <div>
                                    <div>2 Hr. Gaming Party</div>
                                    <span>$275</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>3 Hour Gaming Party</div>
                                    <span>$350</span>
                                </div>
                                <span>3 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>4 Hour Gaming Party</div>
                                    <span>$525</span>
                                </div>
                                <span>4 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Additional Time- Full Amount</div>
                                    <span>$150</span>
                                </div>
                                <span>1 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 id="CONCESSIONS">CONCESSIONS</h2>
                        <div>
                            <div>
                                <div>
                                    <div>Popcorn Machine</div>
                                    <span>$175</span>
                                </div>
                                <span>1 hr 30 mins</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Cotton Candy Machine</div>
                                    <span>$225</span>
                                </div>
                                <span>1 hr 30 mins</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Sno Cone</div>
                                    <span>$125</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Large Hot Dog Grill</div>
                                    <span>$150</span>
                                </div>
                                <span>4 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 id="Professional Arena Style Laser Tag for up to 18 players">
                            Professional Arena Style Laser Tag for up to 18 players
                        </h2>
                        <div>
                            <div>
                                <div>
                                    <div>Add on - Two .15 min laser Tag Session</div>
                                </div>
                                <span>45 mins</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>$200 Deposit required for Stand Alone Laser Tag Party</div>
                                    <span>$200</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 id="Movie Packages">Movie Packages</h2>
                        <div>
                            <div>
                                <div>
                                    <div>Movie and Gaming Combo</div>
                                    <span>$437.50</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Movie Party</div>
                                    <span>$250</span>
                                </div>
                                <span>3 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 id="Jumbo Yard Games">Jumbo Yard Games</h2>
                        <div>
                            <div>
                                <div>
                                    <div>2 Extra Large Connect 4</div>
                                    <span>$145</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Extra large yard Jenga</div>
                                    <span>$60</span>
                                </div>
                                <span>1 hr 30 mins</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Extra Large Connect 4</div>
                                    <span>$80</span>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 id="Schools and Corporate Events">Schools and Corporate Events</h2>
                        <div>
                            <div>
                                <div>
                                    <div> School Event - 2 Hrs </div>
                                </div>
                                <span>2 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>School Event - 3 hrs</div>
                                </div>
                                <span>30 mins</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Corp. Events - 4 hrs</div>
                                </div>
                                <span>4 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 id="ADDITIONAL ADD ONS">ADDITIONAL ADD ONS</h2>
                        <div>
                            <div>
                                <div>
                                    <div>Projector</div>
                                    <span>$250</span>
                                </div>
                                <span>4 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Projector &amp; Screen Combo</div>
                                    <span>$400</span>
                                </div>
                                <span>4 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <div>Stage - 4 x 4'</div>
                                    <span>$150</span>
                                </div>
                                <span>4 hr</span>
                                <div>
                                    <button>
                                        Book
                                        <MdSchedule />
                                    </button>
                                    <button aria-expanded="false">
                                        Details
                                        <MdInfoOutline />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
