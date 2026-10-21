import { Faq } from "./faq";

// Local landing pages for the standard (no travel fee) service area. Each one gets its own prerendered URL,
// sitemap entry and FAQ structured data, so keep the copy specific to the place.
export interface Area {
    slug: string;
    name: string;
    path: string;
    title: string;
    description: string;
    heading: string;
    lede: string;
    intro: string[];
    places: string[];
    placesNote: string;
    tips: { title: string; text: string }[];
    faqs: Faq[];
    photo: "birthday-group" | "trailer-street" | "laser-tag-arena";
}

export const AREAS: Area[] = [
    {
        slug: "queens",
        name: "Queens",
        path: "/video-game-truck-queens",
        title: "Video Game Truck Parties in Queens, NY | Prestigious Gaming on Wheels Plus",
        description:
            "Queens' own luxury video game truck and laser tag parties. PS5, Xbox Series X, Switch, VR and up to 28 players, with no travel fee anywhere in Queens. Call (718) 673-8529.",
        heading: "The video game truck party Queens calls its own",
        lede: "We're a family-owned gaming company based right here in Queens. Our luxury trailer pulls up to your house, block or school with no travel fee anywhere in the borough.",
        intro: [
            "Queens is home base. We are a Queens family, so your party is a short drive away and there is no travel surcharge anywhere in the borough, from Astoria to the Rockaways.",
            "Every gaming party brings seven indoor 4K TVs, two outdoor screens under a 14-foot awning, PS5, Xbox Series X, Nintendo Switch and VR. Add live-scored laser tag in your backyard, driveway or school yard and the whole block will hear about it.",
        ],
        places: [
            "Jamaica",
            "Springfield Gardens",
            "Laurelton",
            "Rosedale",
            "St. Albans",
            "Cambria Heights",
            "Hollis",
            "Queens Village",
            "Fresh Meadows",
            "Flushing",
            "Bayside",
            "Forest Hills",
            "Rego Park",
            "Richmond Hill",
            "Ozone Park",
            "Howard Beach",
            "Astoria",
            "Long Island City",
            "Jackson Heights",
            "Elmhurst",
            "Corona",
            "Ridgewood",
            "Far Rockaway",
            "Whitestone",
        ],
        placesNote: "Don't see your neighborhood? If it's in Queens, it's in our standard area.",
        tips: [
            {
                title: "Save the curb early",
                text: "The trailer needs about 5 car lengths. On busy Queens blocks, ask neighbors to leave spots open the night before or park your own cars out front to hold the space.",
            },
            {
                title: "Driveways and school lots work great",
                text: "A long driveway, a church lot or a school yard is often easier than the street. Tell us where you're thinking and we'll let you know if it fits.",
            },
            {
                title: "Apartment? No problem",
                text: "Apartment buildings and co-ops work too, as long as there is curb space out front. Guests step right off the sidewalk into the climate-controlled trailer.",
            },
        ],
        faqs: [
            {
                question: "Is there a travel fee in Queens?",
                answer: "No. Every Queens neighborhood is in our standard service area, so the package price is the price.",
            },
            {
                question: "Can you park on a street in Queens?",
                answer: "Yes, as long as there are about 5 car lengths of legal parking for the trailer. Driveways, church lots and school lots also work.",
            },
            {
                question: "Do you do school and church events in Queens?",
                answer: "Yes. We run class rotations, fun days and fundraisers with gaming, laser tag and concessions. Call for a group quote.",
            },
        ],
        photo: "birthday-group",
    },
    {
        slug: "brooklyn",
        name: "Brooklyn",
        path: "/video-game-truck-brooklyn",
        title: "Video Game Truck & Laser Tag Parties in Brooklyn | Prestigious Gaming on Wheels Plus",
        description:
            "Bring a luxury game truck to your Brooklyn block party, birthday or school event. 9 HD screens, PS5, Xbox, Switch, VR and laser tag, with no travel fee in Brooklyn.",
        heading: "Game truck parties for every Brooklyn block",
        lede: "Brownstone birthdays, block parties and school fun days. Our climate-controlled gaming trailer rolls into any Brooklyn neighborhood with no travel fee.",
        intro: [
            "Brooklyn is part of our standard service area, so there's no travel surcharge whether you're in Canarsie, Bed-Stuy or Bay Ridge. We pull up, set up and run the whole party while you enjoy it.",
            "Up to 28 kids can game at once on PS5, Xbox Series X and Nintendo Switch, with VR and 1,000+ retro arcade games for the grown-ups. Have a block party coming up? The outdoor screens and live-scored laser tag turn a closed street into an arena.",
        ],
        places: [
            "Canarsie",
            "East Flatbush",
            "Flatbush",
            "Flatlands",
            "Mill Basin",
            "Marine Park",
            "Sheepshead Bay",
            "Bay Ridge",
            "Bensonhurst",
            "Dyker Heights",
            "Borough Park",
            "Midwood",
            "Crown Heights",
            "Bedford-Stuyvesant",
            "Bushwick",
            "East New York",
            "Brownsville",
            "Park Slope",
            "Williamsburg",
            "Greenpoint",
            "Coney Island",
            "Sunset Park",
            "Fort Greene",
            "Starrett City",
        ],
        placesNote: "Don't see your neighborhood? If it's in Brooklyn, it's in our standard area.",
        tips: [
            {
                title: "Block party? Get the permit first",
                text: "In NYC, closing a street for a block party needs a permit from the city's Street Activity Permit Office. Apply well ahead of your date, then book us for the same day.",
            },
            {
                title: "Hold 5 car lengths",
                text: "Brooklyn parking goes fast. Park your own cars out front the night before, or let us know about a nearby lot, school yard or church parking area.",
            },
            {
                title: "No backyard needed",
                text: "Everything happens inside the trailer and under its awning, so a brownstone stoop or an apartment building entrance works just fine.",
            },
        ],
        faqs: [
            {
                question: "Is there a travel fee in Brooklyn?",
                answer: "No. Brooklyn is in our standard service area, so there is no travel surcharge anywhere in the borough.",
            },
            {
                question: "Can you come to a Brooklyn block party?",
                answer: "Yes. Once your block party permit is approved, book us for the date. The outdoor screens and laser tag are made for closed streets. Call for a quote for big crowds.",
            },
            {
                question: "Where does the trailer park in Brooklyn?",
                answer: "Anywhere with about 5 car lengths of legal parking: your street, a driveway, a school yard or a church lot.",
            },
        ],
        photo: "trailer-street",
    },
    {
        slug: "nassau-county",
        name: "Nassau County",
        path: "/video-game-truck-nassau-county",
        title: "Video Game Truck Parties in Nassau County, Long Island | Prestigious Gaming on Wheels Plus",
        description:
            "Luxury video game truck and laser tag parties for Nassau County, Long Island. PS5, Xbox Series X, Switch, VR and up to 28 players in your driveway or backyard.",
        heading: "Long Island's luxury video game truck",
        lede: "Driveway birthdays, backyard laser tag and school fun days across Nassau County, brought to you by a family-owned team from just across the Queens line.",
        intro: [
            "We are based in southeast Queens, a few miles from the Nassau border, so parts of the county are in our standard service area with no travel fee. Tell us your town when you reach out and we'll confirm it before you book.",
            "Nassau driveways and backyards are perfect for the full setup: the gaming trailer with 9 HD screens, PS5, Xbox Series X, Nintendo Switch and VR, plus arena-style laser tag with inflatable bunkers on the lawn.",
        ],
        places: [
            "Elmont",
            "Valley Stream",
            "Franklin Square",
            "Floral Park",
            "New Hyde Park",
            "Hempstead",
            "Uniondale",
            "West Hempstead",
            "Garden City",
            "Lynbrook",
            "Rockville Centre",
            "Oceanside",
            "Baldwin",
            "Freeport",
            "Roosevelt",
            "Merrick",
            "East Meadow",
            "Levittown",
            "Westbury",
            "Hicksville",
            "Long Beach",
            "The Five Towns",
        ],
        placesNote:
            "Parts of Nassau County are in our standard area. Farther east, a travel surcharge may apply, so call or message us with your town.",
        tips: [
            {
                title: "Use the driveway",
                text: "Most Nassau parties set up right in the driveway or in front of the house. We just need about 5 car lengths of space.",
            },
            {
                title: "Laser tag on the lawn",
                text: "A flat backyard or front lawn is ideal for our inflatable arena. Laser tag is weather permitting, while the gaming trailer runs rain or shine.",
            },
            {
                title: "Schools and PTAs",
                text: "We run field days, class rotations and fundraisers for Nassau schools. Call us with your date and headcount for a group quote.",
            },
        ],
        faqs: [
            {
                question: "Is there a travel fee in Nassau County?",
                answer: "Parts of Nassau County are in our standard area with no travel fee. For towns farther east, a travel surcharge may apply. Tell us your town and we'll confirm before you book.",
            },
            {
                question: "Can the trailer park in my driveway?",
                answer: "Usually, yes. We need about 5 car lengths of space in the driveway or along the curb in front of the house.",
            },
            {
                question: "Do you serve Suffolk County too?",
                answer: "Yes, Suffolk County is available for an additional travel surcharge. Call (718) 673-8529 for a quote.",
            },
        ],
        photo: "laser-tag-arena",
    },
];

export function areaForPath(path: string) {
    return AREAS.find((a) => a.path === path);
}
