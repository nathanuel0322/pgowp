import GamingContract from "../assets/files/GamingContract.pdf";
import "../assets/css/about.css";

export default function About() {
    return (
        <div id="aboutdiv" className="flex items-center justify-center mt-[10vh]">
            <div id="overlay"></div>
            <div id="abouttext">
                <strong>
                    <p className="family-owned">Prestigious Gaming on Wheels Plus is a new family-owned business.</p>
                    <br />
                    <p>
                        We have two boys, currently 18 and 13 years old, who love gaming. As a family, we always believe
                        once a child is doing well in school, then why not let them have fun and enjoy what they love
                        most? Our family knows what it takes for children to have fun.
                    </p>
                    <br />
                    <p>
                        We cater to both boys and girls. We have 2 50" TV's outside with a 14' awning for all the girls'
                        needs for Just Dance! There's ample space to dance. We are a very tech savvy family, so we have
                        the latest and the greatest systems!
                    </p>
                    <br />
                    <p>
                        We have a very prestigious game trailer that gives our players the utmost comfort & style. So,
                        see for yourself by booking us today! Thank you!
                    </p>
                    <br />
                    <p>
                        - 7 50" 4K TV's
                        <br />- 2 50" 4K TV's outside, along with a 14' awning & exterior heat
                    </p>
                    <br />
                    <p>
                        <a
                            href={GamingContract}
                            download="Contract"
                            style={{ textDecoration: "underline", color: "rgb(255, 172, 43)" }}
                        >
                            Click here to download and view our terms and conditions!
                        </a>
                    </p>
                    <br />
                    For parties in <span id="NJ">New Jersey</span>, click{" "}
                    <a
                        id="triplea"
                        href="https://www.tripleamobilegaming.com/"
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        here
                    </a>{" "}
                    to check out our sister company, TripleA.
                    <br />
                </strong>
            </div>
        </div>
    );
}
