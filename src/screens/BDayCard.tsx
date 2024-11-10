import "../assets/css/bdaycard.css";
import { toastPromise } from "../GlobalFunctions.ts";

export default function BDayCard() {
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
    };

    return (
        <div id="bdaycard" className="flex flex-col items-center gap-[2vh]">
            <form id="CardtoSave" onSubmit={handleSubmit} className="flex flex-col gap-[2vh] items-center w-full !p-0">
                <input
                    id="childnameinput"
                    className="inputs"
                    type="text"
                    name="ChildName"
                    placeholder="Birthday Child's Name"
                />
                <input
                    id="locationinput"
                    className="inputs"
                    type="text"
                    name="Location"
                    placeholder="Location of Party"
                />
                <input
                    id="partytimeinput"
                    className="inputs"
                    type="text"
                    name="Party Date and Time"
                    placeholder="Party Date and Time"
                />
                <input id="phonenumberinput" className="inputs" type="text" name="Phone Number" placeholder="Phone #" />
            </form>
            <input
                type="submit"
                value="Save Image"
                id="bdaybutton"
                className="cursor-pointer rounded-lg"
                onClick={async () => {
                    toastPromise(
                        new Promise((resolve, reject) => {
                            const childname = (document.getElementById("childnameinput") as HTMLInputElement)?.value;
                            const location = (document.getElementById("locationinput") as HTMLInputElement)?.value;
                            const partytime = (document.getElementById("partytimeinput") as HTMLInputElement)?.value;
                            const phonenumber = (document.getElementById("phonenumberinput") as HTMLInputElement)
                                ?.value;

                            fetch(
                                process.env.NODE_ENV === "development"
                                    ? "http://localhost:3001/bdaycard"
                                    : "https://widgie-34c32488147a.herokuapp.com/bdaycard",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        childname,
                                        location,
                                        partytime,
                                        phonenumber,
                                    }),
                                }
                            )
                                .then((response) => response.json())
                                .then((data) => {
                                    // Create a blob from the base64 data
                                    const byteCharacters = atob(data);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: "image/png" });

                                    // Create a link element
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.download = "BirthdayCard.png";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                    resolve();
                                })
                                .catch((error) => {
                                    console.error("Error saving image:", error);
                                    reject(error);
                                });
                        }),
                        "Please allow a few seconds for the image to download!",
                        "E-Invite Saved! 🎉"
                    );
                }}
            />
        </div>
    );
}
