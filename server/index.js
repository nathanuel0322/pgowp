const puppeteer = require("puppeteer");
const express = require("express");
const mongoose = require("mongoose");
const Review = require("./Review");
const dotenv = require("dotenv");
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

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ovpx1ss.mongodb.net/pgowp?retryWrites=true&w=majority&appName=Cluster0`;
mongoose
    .connect(uri)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((error) => console.error("Error connecting to MongoDB Atlas:", error));

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

            async function fetchYelpReviews() {
                // review__09f24__oHr9V
                const data = [];
                // iterate through each ul element
                document.querySelectorAll("ul").forEach((el, index) => {
                    // console.log("el: ", el, "index: ", index);
                    if (el.children.length > 9 && el.textContent.includes("Tricia")) {
                        // console.log(el, index);
                        for (let i = 0; i < el.children.length; i++) {
                            const element = el.children[i];
                            //   console.log("element at index: ", i, "is: ", element);
                            // Use querySelectorAll with attribute selector to find elements with role="img"
                            const imgElements = element.querySelector('[role="img"][aria-label*="rating"]');
                            //   console.log("img:", imgElements);
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
                            //   console.log("dataObject: ", dataObject);
                            data.push(dataObject);
                        }
                    }
                });
                // console.log("data: ", data);
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

const openPageAndScroll = async (type, input) => {
    const browser = await puppeteer.launch({
        headless: true,
        // headless: false,
        args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(
        type === "BdayCard"
            ? "https://www.prestigiousgamingonwheelsplus.com/#/e-invites"
            : "https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6718162,-73.7834512,21z/data=!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!9m1!1b1"
    );
    await page.setViewport({
        width: 1200,
        height: 800,
    });
    let data;
    if (type === "BdayCard") {
        data = await screenshotTaker(page, input);
        await browser.close();
    } else {
        let googledata = await autoScroll(page);
        // console.log("Google returned: ", googledata);
        data = [...googledata];
        await page.goto("https://www.yelp.com/biz/prestigious-gaming-on-wheels-plus-queens");
        let yelpdata = await getYelpData(page);
        // console.log("Yelp returned: ", yelpdata);
        data = [...data, ...yelpdata];
        // console.log("final data: ", data);
        await browser.close();
    }
    // console.log("data: ", data);
    return data;
};

app.get("/fetchreviews", async (req, res) => {
    try {
        const data = await openPageAndScroll();
        const reviews = await Review.find();
        for (const review of data) {
            const newReview = new Review(review);
            const existingReview = reviews.find(
                (r) => r.name === newReview.name && r.time === newReview.time && r.reviewtext === newReview.reviewtext
            );
            if (!existingReview) {
                await newReview.save();
            }
        }
        res.json({ message: "reviews added to database" });
    } catch (error) {
        console.error("Error adding reviews to database: ", error);
        res.status(500).json({ message: error.message });
    }
});

app.get("/getreviews", async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (error) {
        console.error("Error getting reviews: ", error);
        res.status(500).json({ message: error.message });
    }
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
