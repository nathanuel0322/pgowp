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
    const [persclientHeight, setPersClientHeight] = useState(null)
    const [isalltextvisible, setIsAllTextVisible] = useState(false)

    useEffect(() => {
        if (!localreadvar) {
            console.log("localreadvar ran")
            const curcontainer = document.getElementsByClassName('awssld__container')[0];
            const reviewtextel = document.getElementById('reviewtext');
            
            
            const tempEl = document.createElement('p');
            tempEl.innerHTML = reviewtextel.innerHTML;
            tempEl.style.cssText = window.getComputedStyle(reviewtextel).cssText;
            tempEl.style.overflow = 'visible';
            tempEl.style.maxHeight = 'none';
            tempEl.style.position = 'absolute';
            tempEl.style.top = '-9999px';
            document.body.appendChild(tempEl);

            // height of reviewtext is being held down here

            const oldHeight = reviewtextel.clientHeight;
            const newHeight = tempEl.clientHeight;

            document.body.removeChild(tempEl);

            console.log("clientHeight of aswsld__container is:", curcontainer.clientHeight)
            console.log("combination is:", curcontainer.clientHeight - oldHeight + newHeight)

            const slideparentdiv = document.getElementById('slideparent')
            if (curcontainer.clientHeight < slideparentdiv.clientHeight) {
                setPersClientHeight(curcontainer.clientHeight)
                curcontainer.style.height = ((curcontainer.clientHeight + newHeight) * .75) + "px";
                console.log("new height is:", curcontainer.clientHeight + newHeight)
            }
        }
        else {
            // change height back to normal here
            document.getElementsByClassName('awssld__container')[0].style.height = persclientHeight + "px";
        }
    }, [localreadvar])

    useEffect(() => {
        const reviewtextel = document.getElementById('reviewtext');
        if (reviewtextel.scrollHeight <= reviewtextel.clientHeight) {
            // All the text is visible and fits inside the element
            setIsAllTextVisible(true)
        } else {
        // Some text is hidden or overflowing outside the element
            setIsAllTextVisible(false)
        }
        console.log("istablet is:", largerthanmobile)
        setPersClientHeight(document.getElementsByClassName('awssld__container')[0].clientHeight)
    }, [])

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
        console.log("shv changed inside slide.jsx:", slideheightvar)
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
                {!isalltextvisible &&
                    <button id='readmore' onClick={() => {
                        setLocalReadVar(!localreadvar);
                        slideheightfunc()
                        // Get the target element
                        const targetElement = document.getElementById('slideparent');

                        // Scroll to the target element with smooth animation
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        {!localreadvar ? "Hide" : "Read more"}
                    </button>
                }
            </div>
        </div>
    )
}