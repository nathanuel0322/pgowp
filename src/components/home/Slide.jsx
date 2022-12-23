import { useState, useEffect, useRef } from 'react';
import '../../assets/css/slide.css';
import StarSet from './StarSet';
export default function Slide({name, time, stars, photo, reviewtext}) {
    const [showButton, setShowButton] = useState(false)
    const [ptextalter, setPTextAlter] = useState(reviewtext)
    const notInitialRender = useRef(false);
    useEffect(() => {
        const rtarr = reviewtext.split(" ")
        if (rtarr.length >= 20) {
            console.log("More than 20 words")
            setShowButton(true);
            setPTextAlter(rtarr.slice(0, 20).join(" "))
        }
    }, [])

    useEffect(() => {
        console.log("show button is:", showButton)
        if (notInitialRender.current) {
            if (!showButton) {
                setPTextAlter(reviewtext);
                console.log("p to orig text");
            }
        }
        else {
            notInitialRender.current = true;
        }
    }, [showButton])

    useEffect(() => {
        document.getElementsByClassName("awssld--organic-arrows")[0].style.height = document.getElementsByClassName("awssld__wrapper")[0].offsetHeight + document.getElementById("reviewtext").offsetHeight + "px";
    }, [ptextalter])


    return (
        <div id="slideparent" style={{display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '3rem', left: '1rem'}}>
            <div id="topdiv">
                <img src={photo} />
                <div id="namestarts">
                    <p>{name}</p>
                    <div><span id='slidestars'>{<StarSet num={stars} />}</span><span id='timedisplay'>{time}</span></div>
                </div>
            </div>
            <div id="reviewtextbox">
                <p id="reviewtext">{ptextalter}</p>
                {showButton && <button id='readmore' onClick={() => {
                    setShowButton(false);
                    // set the height of the div with class "awssld--organic-arrows" equal to the height of the div with class "awssld__wrapper" + the height of the div with class "reviewtext"
                    }} style={{textDecoration: 'underline'}}>Read more</button>}
            </div>
        </div>
    )
}