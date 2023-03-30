import { useState, useEffect, useRef } from 'react';
import '../../assets/css/slide.css';
import StarSet from './StarSet';
import { useMediaQuery } from 'react-responsive';

export default function Slide({name, time, stars, photo, reviewtext, isyelp, slideheightfunc, slideheightvar, reviewTextRef}) {
    const [localreadvar, setLocalReadVar] = useState(slideheightvar);
    const largerthanmobile = useMediaQuery({query: '(min-width: 480px)'});
    // const tablet = useMediaQuery({query: '(min-width: 768px)'});
    // const laptopsize = useMediaQuery({query: '(min-width: 1024px)'});
    // give each Slide component its own instance of reviewtext
    // const [rtstorage, setRTStorage] = useState(reviewtext)
    // const [slideheightvar, setReadMoreVisible] = useState(false)
    const [ptextalter, setPTextAlter] = useState(reviewtext)
    const [expandText, setExpandText] = useState(false)
    const notInitialRender = useRef(false);

    useEffect(() => {
        console.log("istablet is:", largerthanmobile)
    }, [])

    useEffect(() => {
        console.log("shv changed inside slide.jsx:", slideheightvar)
    }, [slideheightvar])

    useEffect(() => {
        // console.log("reviewtext is:", reviewtext)
        // console.log("reviewtext is:", ptextalter)
        if (largerthanmobile) {
            // const heightstorage = document.getElementsByClassName("awssld__wrapper")[0].offsetHeight + document.getElementById("reviewtext").offsetHeight - (2.5 * document.getElementById("topdiv").offsetHeight) + "px";
            // document.getElementsByClassName("awssld--foldOutAnimation")[0].style.height = heightstorage;
            // document.getElementsByClassName("awssld--active")[0].style.height = heightstorage;
        }
    }, [reviewtext])

    useEffect(() => {
        // console.log("show button is:", slideheightvar)
        if (notInitialRender.current) {
            if (!slideheightvar) {
                setPTextAlter(reviewtext);
                setExpandText(true);
            }
        }
        else {
            notInitialRender.current = true;
        }
    }, [slideheightvar])

    // use useffect to scroll to bottom of page when ptextalter.expand is true

    useEffect(() => {
        if (expandText) {
            // console.log("initial organic height:", document.getElementsByClassName("awssld--foldOutAnimation")[0].offsetHeight)
            console.log("initial wrapper height:", document.getElementsByClassName("awssld__wrapper")[0].offsetHeight)
            console.log("initial reviewtext height:", document.getElementById("reviewtext").offsetHeight)
            // document.getElementsByClassName("awssld--foldOutAnimation")[0].style.height = document.getElementsByClassName("awssld__wrapper")[0].offsetHeight + document.getElementById("reviewtext").offsetHeight - (2.5 * document.getElementById("topdiv").offsetHeight) + "px";
            console.log("new organic height:", document.getElementsByClassName("awssld--foldOutAnimation")[0].offsetHeight)
            // scroll to the bottom of the page
            window.scrollTo(0, document.body.scrollHeight);
        }
    }, [expandText])


    return (
        <div id="slideparent" ref={reviewTextRef}>
            <div id="topdiv" style={{marginBottom: isyelp && '0.5rem'}}>
                <img src={photo} id="topdivimg" style={{borderRadius: isyelp && '2rem', width: isyelp && '2.25rem', height: isyelp && '2.25rem'}} 
                    referrerPolicy="no-referrer" alt=""
                />
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
            <div id="reviewtextbox" style={{height: !localreadvar && 'auto'}}>
                <p id="reviewtext" style={{overflow: !localreadvar ? 'visible' : 'hidden', maxHeight: !localreadvar ? '100%' : '67px'}}>
                    {largerthanmobile ? reviewtext : ptextalter}
                </p>
                <button id='readmore' onClick={() => {setLocalReadVar(!localreadvar); slideheightfunc()}}>
                    {!localreadvar ? "Hide" : "Read more"}
                </button>
            </div>
        </div>
    )
}