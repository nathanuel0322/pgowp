import { useState, useEffect } from 'react';
import '../../assets/css/slide.css';
import StarSet from './StarSet';
export default function Slide({name, time, stars, photo, reviewtext}) {
    const [showButton, setShowButton] = useState(false)
    const [ptextalter, setPTextAlter] = useState(reviewtext)
    useEffect(() => {
        const rtarr = reviewtext.split(" ")
        if (rtarr.length >= 20) {
            console.log("More than 20 words")
            setShowButton(true);
            setPTextAlter(rtarr.slice(0, 20).join(" "))
        }
    }, [])

    return (
        <div id="slideparent" style={{display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <div id="topdiv">
                <img src={photo} alt="reviewer" />
                <div id="namestarts">
                    <p>{name}</p>
                    <p><span id='slidestars'>{<StarSet num={stars} />}</span><span id='timedisplay'>{time}</span></p>
                </div>
            </div>
            <div id="reviewtextbox">
                <p id="reviewtext">{ptextalter}</p>
                {showButton && <button id='readmore'>Read more</button>}
            </div>
        </div>
    )
}