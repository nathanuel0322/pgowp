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
    useEffect(() => {
        console.log("reviews", reviews)
        setSliderArr(reviews.map((review) => {
            return {children: 
                <Slide name={review.name} time={review.time} stars={review.stars} photo={review.photo} reviewtext={review.reviewtext} 
                    isyelp={review.yelp}
                    slideheightfunc={heightfunc}
                    slideheightvar={heightvar}
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
                console.log("on transition start")
                document.getElementById('reviewtext').style.overflow = "hidden";
                document.getElementsByClassName('awssld__container')[0].style.height = "auto";
                // document.getElementById('readmore').style.display = "inline-block";

                document.getElementsByClassName('readmore')[0].style.display = "inline-block";
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