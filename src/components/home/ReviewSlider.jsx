/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import AwesomeSlider from 'react-awesome-slider';
import CubeStyles from 'react-awesome-slider/src/styled/cube-animation/cube-animation.scss';
import FallStyles from 'react-awesome-slider/src/styled/fall-animation/fall-animation.scss';
import FoldOutStyles from 'react-awesome-slider/src/styled/fold-out-animation/fold-out-animation.scss';
import withAutoplay from 'react-awesome-slider/dist/autoplay';
import 'react-awesome-slider/dist/styles.css';
import '../../assets/css/reviewslider.css';
import Slide from "./Slide";

export default function ReviewSlider({reviews}) {
    const [sliderarr, setSliderArr] = useState([])
    const [readmoretrigger, setReadMoreTrigger] = useState(false)
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        console.log("reviews", reviews)
        setSliderArr(reviews.map((review) => {
            return {children: 
                <Slide name={review.name} time={review.time} stars={review.stars} photo={review.photo} reviewtext={review.reviewtext} 
                    isyelp={review.yelp} readtrigger={readmoretrigger}
                />
            }
        }))
    }, [])

    useEffect(() => {
        console.log("reviews changed")
        console.log("reviews now", reviews)
        setSliderArr(reviews.map((review) => {
            return {children: 
                <Slide name={review.name} time={review.time} stars={review.stars} photo={review.photo} reviewtext={review.reviewtext} 
                    isyelp={review.yelp} readtrigger={readmoretrigger}
                />
            }
        }))
        
        if (!isFirstRender) {
            // press the button with class "awssld__next"
            document.getElementsByClassName('awssld__next')[0].click();
        } else {
            setIsFirstRender(false);
        }
    }, [reviews])
    
    useEffect(() => {
        console.log("slider arr is:", sliderarr)
    }, [sliderarr])

    // const AutoplaySlider = withAutoplay(AwesomeSlider);


    return (
        // <AutoplaySlider
        <AwesomeSlider
            className="midslideshow"
            bullets={false}
            play={true}
            cancelOnInteraction={true} // should stop playing on user interaction
            interval={6000}
            media={sliderarr}
            onTransitionStart={(e) => {
                setReadMoreTrigger(true)
                document.getElementById('reviewtext').style.overflow = "hidden";
                document.getElementsByClassName('awssld__container')[0].style.height = "auto";
                document.getElementsByClassName('readmore')[0].style.display = "inline-block";
            }}
            onTransitionEnd={(e) => {
                // setReadMoreTrigger(false)
            }}
            mobileTouch={true}
            // organicArrows={false}
            // cssModule={CubeStyles}
            // animation="cubeAnimation"
            cssModule={FoldOutStyles}
            animation="foldOutAnimation"
            // if sliderarr is empty, turn off arrows
            organicArrows={sliderarr.length === 0 ? false : true}
        />
    )
}