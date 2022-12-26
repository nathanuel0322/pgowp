import { useState, useEffect, useRef } from 'react';
import '../../assets/css/slide.css';
import StarSet from './StarSet';
export default function Slide({name, time, stars, photo, reviewtext, isyelp}) {
    const [showButton, setShowButton] = useState(false)
    const [ptextalter, setPTextAlter] = useState({text: reviewtext, expand: false})
    const notInitialRender = useRef(false);
    useEffect(() => {
        console.log("platform:", isyelp)
        const rtarr = reviewtext.split(" ")
        if (rtarr.length >= 20) {
            // console.log("More than 20 words")
            setShowButton(true);
            setPTextAlter({text: rtarr.slice(0, 20).join(" ")})
        }
    }, [])

    useEffect(() => {
        // console.log("show button is:", showButton)
        if (notInitialRender.current) {
            if (!showButton) {
                setPTextAlter({text: reviewtext, expand: true});
            }
        }
        else {
            notInitialRender.current = true;
        }
    }, [showButton])

    // use useffect to scroll to bottom of page when ptextalter.expand is true

    useEffect(() => {
        if (ptextalter.expand) {
            console.log("initial organic height:", document.getElementsByClassName("awssld--organic-arrows")[0].offsetHeight)
            console.log("initial wrapper height:", document.getElementsByClassName("awssld__wrapper")[0].offsetHeight)
            console.log("initial reviewtext height:", document.getElementById("reviewtext").offsetHeight)
            document.getElementsByClassName("awssld--organic-arrows")[0].style.height = document.getElementsByClassName("awssld__wrapper")[0].offsetHeight + document.getElementById("reviewtext").offsetHeight - (2.5 * document.getElementById("topdiv").offsetHeight) + "px";
            console.log("new organic height:", document.getElementsByClassName("awssld--organic-arrows")[0].offsetHeight)
            // scroll to the bottom of the page
            window.scrollTo(0, document.body.scrollHeight);
        }
    }, [ptextalter])


    return (
        <div id="slideparent" style={{display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '3rem', left: '1rem'}}>
            <div id="topdiv" style={{marginBottom: isyelp && '0.5rem'}}>
                <img src={photo} style={{borderRadius: isyelp && '2rem', width: isyelp && '2.25rem', height: isyelp && '2.25rem'}} alt=""/>
                <div id="namestarts">
                    <p>{name}</p>
                    <div id="starsnname"><span id='slidestars'>{isyelp ? <img src={require(`../../assets/icons/regular_${stars}@3x.png`)} style={{width: '6.25rem'}} alt='' /> : <StarSet num={stars} />}</span><span id='timedisplay'>{time}</span></div>
                </div>
            </div>
            <div id="reviewtextbox">
                <p id="reviewtext">{ptextalter.text}</p>
                {showButton && <button id='readmore' onClick={() => {
                    setShowButton(false);
                }} style={{textDecoration: 'underline'}}>Read more</button>}
            </div>
        </div>
    )
}