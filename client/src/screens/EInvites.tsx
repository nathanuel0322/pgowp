import BDayCardPic from "../assets/images/Invites.jpeg";
import "../assets/css/bdaycard.css";

export default function EInvites() {
    return (
        <div id="bdaycard">
            <div id="CardtoSave" className="h-[696px]">
                <img
                    id="bdayimg"
                    src={BDayCardPic}
                    alt="Rectangle Poster"
                    width="100%"
                    className="!h-full !rounded-none"
                />
                <div id="bdaydiv1" className="mt-[-16.2vh] bdaydivs">
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
                </div>
                <div id="bdaydiv2" className="mt-[-0.9vh] bdaydivs">
                    <input
                        id="partytimeinput"
                        className="inputs"
                        type="text"
                        name="Party Time"
                        placeholder="Party Date and Time"
                    />
                    <input
                        id="phonenumberinput"
                        className="inputs"
                        type="text"
                        name="Phone Number"
                        placeholder="Phone #"
                    />
                </div>
            </div>
        </div>
    );
}
