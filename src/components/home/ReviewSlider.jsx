import React, { useEffect, useState, useRef } from "react";
import AwesomeSlider from 'react-awesome-slider';
import CubeStyles from 'react-awesome-slider/src/styled/cube-animation/cube-animation.scss';
import FallStyles from 'react-awesome-slider/src/styled/fall-animation/fall-animation.scss';
import FoldOutStyles from 'react-awesome-slider/src/styled/fold-out-animation/fold-out-animation.scss';
import withAutoplay from 'react-awesome-slider/dist/autoplay';
import 'react-awesome-slider/dist/styles.css';
import '../../assets/css/reviewslider.css';
import Slide from "./Slide";

export default function ReviewSlider({reviews, heightfunc, heightvar}) {
    const [sliderarr, setSliderArr] = useState([])
    const reviewTextRef = useRef(null);
    useEffect(() => {
        console.log("reviews", reviews)
        setSliderArr(reviews.map((review) => {
            return {children: 
                <Slide name={review.name} time={review.time} stars={review.stars} photo={review.photo} reviewtext={review.reviewtext} 
                    isyelp={review.yelp}
                    slideheightfunc={heightfunc}
                    slideheightvar={heightvar}
                    reviewTextRef={reviewTextRef}
                />
            }
        }))
    }, [])
    
    useEffect(() => {
        console.log("slider arr is:", sliderarr)
    }, [sliderarr])

    // const AutoplaySlider = withAutoplay(AwesomeSlider);
    return (
        <AwesomeSlider
            className="midslideshow"
            bullets={false}
            play={true}
            cancelOnInteraction={false} // should stop playing on user interaction
            interval={6000}
            media={sliderarr}
            onTransitionStart={(e) => {
                console.log("ots")
                document.getElementById('reviewtext').style.overflow = "hidden";
                document.getElementsByClassName('awssld__container')[0].style.height = "auto";
            }}
            onTransitionEnd={() => {
                const reviewTextEl = reviewTextRef.current.querySelector('#reviewtext');
                const tempEl = document.createElement('p');
                tempEl.innerHTML = reviewTextEl.innerHTML;
                tempEl.style.cssText = window.getComputedStyle(reviewTextEl).cssText;
                tempEl.style.overflow = 'visible';
                tempEl.style.maxHeight = 'none';
                tempEl.style.position = 'absolute';
                tempEl.style.top = '-9999px';
                document.body.appendChild(tempEl);
                const height = tempEl.offsetHeight;
                document.body.removeChild(tempEl);
                console.log("text in this case:", reviewTextEl.innerText)
                console.log('height of reviewtext expanded:', height);
            }}
            mobileTouch={true}
            organicArrows={false}
            // cssModule={CubeStyles}
            // animation="cubeAnimation"
            cssModule={FoldOutStyles}
            animation="foldOutAnimation"
        />
    )
}