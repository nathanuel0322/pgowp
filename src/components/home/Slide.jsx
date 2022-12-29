import { useState, useEffect, useRef } from 'react';
import '../../assets/css/slide.css';
import StarSet from './StarSet';
import { useMediaQuery } from 'react-responsive';

export default function Slide({name, time, stars, photo, reviewtext, isyelp}) {
    const largerthanmobile = useMediaQuery({query: '(min-width: 480px)'});
    // const tablet = useMediaQuery({query: '(min-width: 768px)'});
    // const laptopsize = useMediaQuery({query: '(min-width: 1024px)'});
    // give each Slide component its own instance of reviewtext
    // const [rtstorage, setRTStorage] = useState(reviewtext)
    const [showButton, setShowButton] = useState(false)
    const [ptextalter, setPTextAlter] = useState(reviewtext)
    const [expandText, setExpandText] = useState(false)
    const notInitialRender = useRef(false);

    useEffect(() => {
        console.log("istablet is:", largerthanmobile)
    }
    , [])

    useEffect(() => {
        console.log("reviewtext is:", reviewtext)
        const rtarr = ptextalter.split(" ")
        if (rtarr.length >= 20) {
            // console.log("More than 20 words")
            setShowButton(true);
            setPTextAlter(rtarr.slice(0, 20).join(" "))
        }
        console.log("reviewtext is:", ptextalter)
        if (largerthanmobile) {
            const heightstorage = document.getElementsByClassName("awssld__wrapper")[0].offsetHeight + document.getElementById("reviewtext").offsetHeight - (2.5 * document.getElementById("topdiv").offsetHeight) + "px";
            document.getElementsByClassName("awssld--foldOutAnimation")[0].style.height = heightstorage;
            document.getElementsByClassName("awssld--active")[0].style.height = heightstorage;
        }
    }, [reviewtext])

    useEffect(() => {
        // console.log("show button is:", showButton)
        if (notInitialRender.current) {
            if (!showButton) {
                setPTextAlter(reviewtext);
                setExpandText(true);
            }
        }
        else {
            notInitialRender.current = true;
        }
    }, [showButton])

    // use useffect to scroll to bottom of page when ptextalter.expand is true

    useEffect(() => {
        if (expandText) {
            console.log("initial organic height:", document.getElementsByClassName("awssld--foldOutAnimation")[0].offsetHeight)
            console.log("initial wrapper height:", document.getElementsByClassName("awssld__wrapper")[0].offsetHeight)
            console.log("initial reviewtext height:", document.getElementById("reviewtext").offsetHeight)
            document.getElementsByClassName("awssld--foldOutAnimation")[0].style.height = document.getElementsByClassName("awssld__wrapper")[0].offsetHeight + document.getElementById("reviewtext").offsetHeight - (2.5 * document.getElementById("topdiv").offsetHeight) + "px";
            console.log("new organic height:", document.getElementsByClassName("awssld--foldOutAnimation")[0].offsetHeight)
            // scroll to the bottom of the page
            window.scrollTo(0, document.body.scrollHeight);
        }
    }, [expandText])


    return (
        <div id="slideparent">
            <div id="topdiv" style={{marginBottom: isyelp && '0.5rem'}}>
                <img src={photo} style={{borderRadius: isyelp && '2rem', width: isyelp && '2.25rem', height: isyelp && '2.25rem'}} alt=""/>
                <div id="namestarts">
                    <p>{name}</p>
                    <div id="starsnname">
                        <span id='slidestars'>
                            {isyelp ?
                                <img src={require(`../../assets/icons/regular_${stars}@3x.png`)} style={{width: '6.25rem'}} alt='' />
                            :
                                <StarSet num={stars} />
                            }
                        </span>
                        <span id='timedisplay'>
                            {time}
                        </span>
                    </div>
                </div>
            </div>
            <div id="reviewtextbox">
                <p id="reviewtext">
                    {
                        largerthanmobile ?
                            reviewtext
                        :
                            ptextalter
                        // if review text is more than 20 words, show the first 20 words
                        // if review text is less than 20 words, show the whole review text
                        // reviewtext.split(" ").length >= 20 ?
                        //     reviewtext.split(" ").slice(0, 20).join(" ")
                        // :
                        //     reviewtext
                    }
                </p>
                {(showButton && !largerthanmobile) && <button id='readmore' onClick={() => setShowButton(false)} style={{textDecoration: 'underline'}}>Read more</button>}
            </div>
        </div>
    )
}