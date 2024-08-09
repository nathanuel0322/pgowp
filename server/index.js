const puppeteer = require("puppeteer");
const express = require("express");
const dotenv = require("dotenv");
const { supabase } = require("./supabase");
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// add access control allow origin header
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});

const autoScroll = async (page) => {
    let scrollable_section = ".m6QErb.DxyBCb";
    await page.waitForSelector(".m6QErb.DxyBCb");
    const dataholder = await page.evaluate(async (selector) => {
        const scrollableSection = document.querySelector(selector);
        const dataPromise = new Promise(async (resolve) => {
            if (scrollableSection) {
                // every 100ms, scroll down as much as possible
                let scrolltop, scrollheight;
                let freq = 0;
                const timer = setInterval(async () => {
                    scrollableSection.scrollTop = scrollableSection.scrollHeight;
                    //   console.log(
                    //     "scrolltop: ",
                    //     scrollableSection.scrollTop,
                    //     "scrollheight: ",
                    //     scrollableSection.scrollHeight
                    //   );
                    if (scrolltop === scrollableSection.scrollTop) {
                        freq++;
                    } else {
                        freq = 0;
                    }
                    // console.log("freq: ", freq);
                    if (freq === 10) {
                        clearInterval(timer);
                        // console.log("stopped scrolling");
                        const buttons = document.getElementsByClassName("w8nwRe");
                        // console.log("buttons: ", buttons);
                        // promise that clicks all buttons
                        const buttonPromise = new Promise((resolve) => {
                            for (let i = 0; i < buttons.length; i++) {
                                buttons[i].click();
                            }
                            resolve();
                        });
                        await buttonPromise;
                        // return a value to const dataholder
                        resolve(await getGoogleData());
                    }
                    scrolltop = scrollableSection.scrollTop;
                    scrollheight = scrollableSection.scrollHeight;
                }, 100);
                async function getGoogleData() {
                    // after the timer is done, create an array of objects with the data we want
                    const data = [];
                    const elements = document.querySelectorAll(".jJc9Ad");
                    elements.forEach((element) => {
                        const nameElement = element.querySelector(".d4r55");
                        const timeElement = element.querySelector(".rsqaWe");
                        const reviewTextElement = element.querySelector(".wiI7pd");

                        const dataObject = {
                            // set name equal to the text within the div with class .d4r55
                            name: nameElement ? nameElement.innerText : "",
                            time: timeElement ? timeElement.innerText : "",
                            // set stars equal to the number of elements with class .hCCjke.vzX5Ic
                            stars: element.querySelector('[role="img"][aria-label*="stars"]').children.length,
                            //   element.querySelectorAll(".hCCjke.vzX5Ic").length,
                            photo: element.querySelector(".NBa7we").src,
                            reviewtext: reviewTextElement ? reviewTextElement.innerText : "",
                            yelp: false,
                        };
                        // console.log("dataObject: ", dataObject);
                        data.push(dataObject);
                    });
                    return data;
                }
            } else {
                // console.log(`cannot find selector ${selector}`);
            }
        });
        return dataPromise;
    }, scrollable_section);
    //   console.log("dataholder: ", dataholder);
    return dataholder;
};

const getYelpData = async (page) => {
    await page.waitForSelector("ul");
    const dataholder = await page.evaluate(() => {
        const dataPromise = new Promise(async (resolve) => {
            // return a value to const dataholder
            resolve(await fetchYelpReviews());

            async function findYelpUl(ulElement) {
                let data = [];
                for (let i = 0; i < ulElement.children.length; i++) {
                    const element = ulElement.children[i];
                    // if element doesnt have child nodes, skip it
                    if (!element.children.length) {
                        continue;
                    }
                    // console.log("element at index: ", i, "is: ", element);
                    // Use querySelectorAll with attribute selector to find elements with role="img"
                    const imgElements = element.querySelector('[role="img"][aria-label*="rating"]');
                    // console.log("img:", imgElements);
                    const dataObject = {
                        // set name equal to the text within the div with class .d4r55
                        name: element.querySelector("a:not(:has(*))").innerText,
                        time: element.innerText.match(
                            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4}/
                        )[0],
                        // set stars equal to the number of elements with class .hCCjke.vzX5Ic
                        stars: imgElements.children.length,
                        photo: element.querySelector("a > img").src,
                        reviewtext: element.querySelector("p").innerText,
                        yelp: true,
                    };
                    // console.log("dataObject: ", dataObject);
                    data.push(dataObject);
                }
                return data;
            }

            async function fetchYelpReviews() {
                // scroll to the bottom of the page
                // wait for 500ms before continuing
                window.scrollTo(0, document.body.scrollHeight);
                function waitForUlElement() {
                    return new Promise((resolve) => {
                        const interval = setInterval(() => {
                            const ulElement = Array.from(document.querySelectorAll("ul")).find(
                                (el) =>
                                    el.textContent.includes("Helpful") &&
                                    el.textContent.includes("Thanks") &&
                                    el.textContent.includes("Love this") &&
                                    el.textContent.includes("Oh no")
                            );
                            if (ulElement) {
                                clearInterval(interval);
                                resolve(ulElement);
                            }
                        }, 100);
                    });
                }

                const ulElement = await waitForUlElement();
                // console.log("ul element: ", ulElement);

                let data = await findYelpUl(ulElement);
                // get the sibling of the ul, which is a div containing the pagination buttons
                const paginationDiv = ulElement.nextElementSibling;
                // last child of paginationDiv tells us how many pages there are
                const lastPage = paginationDiv.lastElementChild.innerText;
                // will say x of y, so we split by space and get the last element
                const lastPageNumber = lastPage.split(" ")[2];
                // we need to click the next button lastPageNumber - 1 times in total
                for (let i = 0; i < parseInt(lastPageNumber) - 1; i++) {
                    // press the last child of paginationDiv's first child
                    paginationDiv.firstElementChild.lastElementChild.lastElementChild.firstChild.firstChild.click();
                    const ulElement2 = await waitForUlElement();
                    data = [...data, ...(await findYelpUl(ulElement2))];
                }
                // console.log("finaldata: ", data);
                return data;
            }
        });
        return dataPromise;
    });
    return dataholder;
};

const screenshotTaker = async (page, input) => {
    const fileElement = await page.waitForSelector("#CardtoSave");
    // fill in 4 inputs on the card
    await page.type("#childnameinput", input.childname);
    // await page.type('#childnameinput', "John Doe");
    await page.type("#locationinput", input.location);
    // await page.type('#locationinput', "123 Main St");
    await page.type("#partytimeinput", input.partytime);
    // await page.type('#partytimeinput', "12:00 PM");
    await page.type("#phonenumberinput", input.phonenumber);
    // await page.type('#phonenumberinput', "123-456-7890");
    await page.click("body");
    // take a screenshot of the card
    const buffer = await fileElement.screenshot({ path: "card.png" });
    const screenshotBase64 = buffer.toString("base64");
    return screenshotBase64;
};

const openPageAndScroll = async ({ type, input, google_site, yelp_site }, page) => {
    await page.goto(type === "BdayCard" ? "https://www.prestigiousgamingonwheelsplus.com/#/e-invites" : google_site);
    await page.setViewport({
        width: 1200,
        height: 800,
    });
    let data;
    if (type === "BdayCard") {
        data = await screenshotTaker(page, input);
    } else {
        if (google_site) {
            let googledata = await autoScroll(page);
            // console.log("Google returned: ", googledata);
            data = [...googledata];
        }
        if (yelp_site) {
            await page.goto(yelp_site);
            let yelpdata = await getYelpData(page);
            // console.log("Yelp returned: ", yelpdata);
            // save yelpdata to a file called yelpdata.json
            // fs.writeFileSync("yelpdata.json", JSON.stringify(yelpdata, null, 2), "utf-8");
            data = [...data, ...yelpdata];
        }
        // console.log("final data: ", data);
    }
    // console.log("data: ", data);
    return data;
};

app.get("/fetchreviews", async (req, res) => {
    // Send immediate response to the client
    res.json({ message: "Request received, processing reviews in the background" });
    const browser = await puppeteer.launch({
        // headless: true,
        headless: false,
        args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    // await openPageAndScroll();

    // get all active widgets from supabase, then look through each
    const { data, error } = await supabase.from("widgets").select("*").eq("status", "active");
    if (error) {
        console.error("Error fetching widgets:", error);
        return;
    }
    // console.log("data: ", data);
    // eliminate all widgets that have null for both google_site and yelp_site
    for (const widget of data.filter((widget) => widget.google_site || widget.yelp_site)) {
        // console.log("widget is: ", widget);
        const data = await openPageAndScroll({ google_site: widget.google_site, yelp_site: widget.yelp_site }, page);
        // console.log("data: ", data);
        let googlereviews = data.filter((review) => !review.yelp);
        let yelpreviews = data.filter((review) => review.yelp);
        // save reviews to supabase
        const { error: reviewerror } = await supabase
            .from("widgets")
            .update({ googlereviews, yelpreviews })
            .eq("id", widget.id);
        if (reviewerror) {
            console.error("Error updating widget with reviews:", reviewerror);
        }
    }
    await browser.close();
});

app.post("/bdaycard", async (req, res) => {
    const bdaycarddata = await openPageAndScroll("BdayCard", req.body);
    res.json(bdaycarddata);
});

app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running on port ${process.env.PORT || 3001}`);
});

// export app as commonjs module
module.exports = app;
