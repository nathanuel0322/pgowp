/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import '../../assets/css/slide.css';
import StarSet from './StarSet';
import { useMediaQuery } from 'react-responsive';
import { ReactComponent as GoogleRating } from '../../assets/icons/googlerating.svg';
import { ReactComponent as YelpRating } from '../../assets/icons/yelprating.svg';

export default function Slide({name, time, stars, photo, reviewtext, isyelp, readtrigger}) {
    const [localreadvar, setLocalReadVar] = useState(true);
    const largerthanmobile = useMediaQuery({query: '(min-width: 480px)'});
    // const tablet = useMediaQuery({query: '(min-width: 768px)'});
    // const laptopsize = useMediaQuery({query: '(min-width: 1024px)'});
    // give each Slide component its own instance of reviewtext
    // const [rtstorage, setRTStorage] = useState(reviewtext)
    // const [slideheightvar, setReadMoreVisible] = useState(false)
    const [persclientHeight, setPersClientHeight] = useState(null)
    const [isalltextvisible, setIsAllTextVisible] = useState(false)
    
    const reviewTextRef = useRef(null);
    const slideParentRef = useRef(null);

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
            // console.log("combination is:", curcontainer.clientHeight - oldHeight + newHeight)

            const slideparentdiv = document.getElementById('slideparent')
            if (curcontainer.clientHeight < slideparentdiv.clientHeight) {
                setPersClientHeight(curcontainer.clientHeight)
                const sumvar = curcontainer.clientHeight + newHeight;
                console.log("cur plus newheight is:", )
                console.log("opp of ltm is:", !largerthanmobile)
                curcontainer.style.height = (sumvar * (!largerthanmobile ? 
                    ((sumvar > 425) ? 1.16 : 1.09375) : 1)) + "px";
                console.log("new height is:", curcontainer.clientHeight)
            }
        }
        else {
            // change height back to normal here
            document.getElementsByClassName('awssld__container')[0].style.height = persclientHeight + "px";
        }
    }, [localreadvar])

    useEffect(() => {
        if (!readtrigger) {
            setLocalReadVar(true);
        }
    }, [readtrigger])

    useEffect(() => {
        const tempEl = document.createElement('p');
        tempEl.innerHTML = reviewTextRef.innerHTML;
        tempEl.style.cssText = window.getComputedStyle(reviewTextRef.current).cssText;
        tempEl.style.overflow = 'visible';
        tempEl.style.maxHeight = 'none';
        tempEl.style.position = 'absolute';
        tempEl.style.top = '-9999px';
        tempEl.style.lineHeight = '1.4';
        tempEl.style.width = reviewTextRef.current.clientWidth + 'px';
        document.body.appendChild(tempEl);
        const oldHeight = reviewTextRef.current.clientHeight;
        const newHeight = tempEl.clientHeight;

        document.body.removeChild(tempEl);
        console.log("oldHeight is:", oldHeight)
        console.log("newHeight is:", newHeight)
        if (oldHeight === newHeight) {
            console.log("old height and new height are equal")
            setIsAllTextVisible(true);
        } else {
            setIsAllTextVisible(false);
        }
        setPersClientHeight(document.getElementsByClassName('awssld__container')[0].clientHeight)
    }, [])

    return (
        <div id="slideparent" ref={slideParentRef}>
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
                <p id="reviewtext" className='reviewtext' ref={reviewTextRef} style={{overflow: !localreadvar ? 'visible' : 'hidden', 
                    maxHeight: localreadvar ? '67px' : '100%'
                }}>
                    {reviewtext}
                </p>
                <button id='readmore' className='readmore' style={{display: isalltextvisible ? 'none' : 'inline-block'}} onClick={() => {
                    setLocalReadVar(!localreadvar);
                    const targetElement = document.getElementsByClassName('gaUYjb')[0];
                    setTimeout(() => {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }, 250);
                }}>
                    {localreadvar ? "Read more" : "Hide"}
                </button>
                <div className="gaUYjb" target="_blank" rel="noopener noreferrer nofollow">
                    <div>
                        <div className="eCIWIG">Posted on</div>
                        {!isyelp ?
                            <GoogleRating height={34} />
                        :
                            <YelpRating height={34} />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}