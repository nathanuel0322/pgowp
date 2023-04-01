import { useState, useEffect, useRef } from 'react';
import '../../assets/css/slide.css';
import StarSet from './StarSet';
import { useMediaQuery } from 'react-responsive';

export default function Slide({name, time, stars, photo, reviewtext, isyelp, slideheightfunc, slideheightvar}) {
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
    
    const reviewTextRef = useRef(null);

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
                curcontainer.style.height = ((curcontainer.clientHeight + newHeight)) + "px";
                console.log("new height is:", curcontainer.clientHeight + newHeight)
            }
        }
        else {
            // change height back to normal here
            document.getElementsByClassName('awssld__container')[0].style.height = persclientHeight + "px";
        }
    }, [localreadvar])

    useEffect(() => {
        // const curcontainer = document.getElementsByClassName('awssld__container')[0];

        const tempEl = document.createElement('p');
        tempEl.innerHTML = reviewTextRef.current.innerHTML;
        tempEl.style.cssText = window.getComputedStyle(reviewTextRef.current).cssText;
        tempEl.style.overflow = 'visible';
        tempEl.style.maxHeight = 'none';
        tempEl.style.position = 'absolute';
        tempEl.style.top = '-9999px';
        tempEl.style.lineHeight = '1.4';
        tempEl.style.width = reviewTextRef.current.clientWidth + 'px';
        document.body.appendChild(tempEl);

        // height of reviewtext is being held down here

        const oldHeight = reviewTextRef.current.clientHeight;
        const newHeight = tempEl.clientHeight;

        document.body.removeChild(tempEl);


        // console.log("combination is:", curcontainer.clientHeight - oldHeight + newHeight)


        if (oldHeight === newHeight) {
            console.log("oldHeight is:", oldHeight)
            console.log("newHeight is:", newHeight)
            setIsAllTextVisible(true);
        } else {
            setIsAllTextVisible(false);
        }
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
        <div id="slideparent">
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
                    maxHeight: !localreadvar ? '100%' : '67px'
                }}>
                    {largerthanmobile ? reviewtext : ptextalter}
                </p>
                <button id='readmore' className='readmore' style={{display: !isalltextvisible ? 'inline-block' : 'none'}} onClick={() => {
                    setLocalReadVar(!localreadvar);
                    slideheightfunc()
                    // Get the target element
                    const targetElement = document.getElementsByClassName('gaUYjb')[0];
                    console.log("targetElement is:", targetElement)
                    // // Scroll to the target element with smooth animation
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }}>
                    {!localreadvar ? "Hide" : "Read more"}
                </button>
                <a className="gaUYjb" href="https://www.google.com/maps/contrib/104354777689671548918/place/ChIJx9WzSu9nwokR_Meb-4kI2Xc" target="_blank" rel="noopener noreferrer nofollow">
                    <div class="ReviewPostedOn__LogoStyle-sc-1s508wm-2 bikRDn">
                        <div class="ReviewPostedOn__Label-sc-1s508wm-5 eCIWIG">Posted on</div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 36" className="injected-svg" dataSrc="https://static.elfsight.com/icons/google-logo-multicolor.svg" xmlnsXlink="http://www.w3.org/1999/xlink"><g fill="none"><path fill="#4285F4" d="M20.82 13.829h-9.86v2.926h6.994c-.346 4.104-3.76 5.854-6.983 5.854-4.123 0-7.72-3.244-7.72-7.791 0-4.43 3.43-7.841 7.73-7.841 3.317 0 5.272 2.115 5.272 2.115l2.05-2.122s-2.63-2.928-7.427-2.928C4.767 4.042.042 9.197.042 14.765c0 5.457 4.445 10.777 10.989 10.777 5.755 0 9.968-3.943 9.968-9.773 0-1.23-.178-1.94-.178-1.94Z"></path><path fill="#EA4335" d="M28.9 11.71c-4.047 0-6.947 3.163-6.947 6.853 0 3.744 2.812 6.966 6.994 6.966 3.785 0 6.886-2.893 6.886-6.886 0-4.576-3.607-6.934-6.934-6.934Zm.04 2.714c1.99 0 3.875 1.609 3.875 4.2 0 2.538-1.878 4.193-3.885 4.193-2.205 0-3.945-1.766-3.945-4.212 0-2.394 1.718-4.181 3.954-4.181Z"></path><path fill="#FBBC05" d="M44.008 11.71c-4.047 0-6.947 3.163-6.947 6.853 0 3.744 2.813 6.966 6.994 6.966 3.785 0 6.886-2.893 6.886-6.886 0-4.576-3.607-6.934-6.933-6.934Zm.04 2.714c1.99 0 3.876 1.609 3.876 4.2 0 2.538-1.878 4.193-3.885 4.193-2.206 0-3.945-1.766-3.945-4.212 0-2.394 1.718-4.181 3.954-4.181Z"></path><path fill="#4285F4" d="M58.825 11.717c-3.714 0-6.633 3.253-6.633 6.904 0 4.16 3.384 6.918 6.57 6.918 1.969 0 3.016-.782 3.79-1.68v1.363c0 2.384-1.448 3.812-3.633 3.812-2.111 0-3.17-1.57-3.538-2.46l-2.655 1.11c.942 1.992 2.838 4.07 6.215 4.07 3.693 0 6.507-2.327 6.507-7.205V12.132h-2.897v1.17c-.89-.96-2.108-1.585-3.726-1.585Zm.27 2.709c1.82 0 3.69 1.554 3.69 4.21 0 2.699-1.866 4.187-3.731 4.187-1.98 0-3.823-1.608-3.823-4.161 0-2.653 1.914-4.236 3.863-4.236Z"></path><path fill="#EA4335" d="M78.33 11.7c-3.504 0-6.445 2.788-6.445 6.901 0 4.353 3.279 6.934 6.781 6.934 2.924 0 4.718-1.6 5.79-3.033l-2.39-1.589c-.62.962-1.656 1.902-3.385 1.902-1.942 0-2.836-1.064-3.389-2.094l9.266-3.845-.481-1.126c-.896-2.207-2.984-4.05-5.747-4.05Zm.12 2.658c1.263 0 2.172.671 2.558 1.476L74.82 18.42c-.267-2.002 1.63-4.062 3.63-4.062Z"></path><path fill="#34A853" d="M67.467 25.124h3.044V4.757h-3.044z"></path></g></svg>
                    </div>
                </a>
            </div>
        </div>
    )
}