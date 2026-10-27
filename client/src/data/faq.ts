export interface Faq {
    question: string;
    answer: string;
    link?: { label: string; href: string; download?: boolean; external?: boolean };
}

export const FAQS: Faq[] = [
    {
        question: "What is Prestigious Gaming on Wheels Plus?",
        answer: "We're a family-owned mobile gaming party company based in Queens, NY. Our luxury game trailer pulls up to your home, school or venue with a full video game theater, VR and arena-style laser tag, so the party comes to you.",
    },
    {
        question: "What inspired the business?",
        answer: "We're a tech-savvy family with two gaming-obsessed sons. We believe kids should get to celebrate with what they love most, especially when they're doing great in school.",
    },
    {
        question: "What's inside the game trailer?",
        answer: "Seven indoor 4K TVs with soundbars, two outdoor 4K TVs under a 14-foot awning, a stand-alone VR section, phone charging stations and climate control with heat and A/C, so you can party rain or shine.",
    },
    {
        question: "Which gaming systems do you have?",
        answer: "PlayStation 5, Xbox Series X and Nintendo Switch with all the latest titles (Fortnite included at no extra cost), plus 1,000+ retro arcade classics like Pac-Man and Donkey Kong for the grown-ups.",
    },
    {
        question: "How many kids can play at once?",
        answer: "Up to 28 players can game at the same time. Gaming packages include up to 24 kids, and each additional child is $10.",
    },
    {
        question: "Is there anything for guests who'd rather dance than game?",
        answer: "Yes. The two outdoor TVs under our 14-foot awning are perfect for Just Dance, and you can add karaoke, a photobooth, giant yard games or laser tag.",
    },
    {
        question: "What happens if it rains?",
        answer: "The gaming trailer is fully climate controlled, so gaming parties go on in any weather. Laser tag is weather permitting. If it's raining we have to cancel laser tag to protect the equipment.",
    },
    {
        question: "How much parking space do you need?",
        answer: "Please save at least 5 car lengths of parking for the trailer. If parking isn't available within 30 minutes of arrival, the deposit is forfeited and the party is canceled.",
    },
    {
        question: "Do you need Wi-Fi?",
        answer: "Usually not. In areas with weak cell service we may need to run a line to your router, so online games work smoothly.",
    },
    {
        question: "Where do you travel?",
        answer: "Queens, Brooklyn and parts of Nassau County are in our standard area. Manhattan, the Bronx, Staten Island, Westchester, Suffolk County and parts of Connecticut are available for an additional travel surcharge.",
    },
    {
        question: "How does booking and payment work?",
        answer: "A 50% deposit locks in your date and time for gaming and movie parties ($200 for a stand-alone laser tag party). The balance is due when we arrive.",
    },
    {
        question: "Do you serve New Jersey?",
        answer: "For parties in New Jersey, book with our sister company, TripleA Mobile Gaming.",
        link: { label: "Visit TripleA Mobile Gaming", href: "https://www.tripleamobilegaming.com/", external: true },
    },
    {
        question: "Where can I read the terms and conditions?",
        answer: "You can download our full party agreement as a PDF.",
        link: { label: "Download terms (PDF)", href: "contract", download: true },
    },
];
