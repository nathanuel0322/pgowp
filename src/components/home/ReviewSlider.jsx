import React, { useEffect, useState } from "react";
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
    const [heightFirstRender, setHeightFirstRender] = useState(null);
    useEffect(() => {
        setHeightFirstRender(document.getElementsByClassName("awssld--foldOutAnimation")[0].style.height);
        console.log("reviews", reviews)
        setSliderArr(reviews.map((review) => {
            // console.log("reviewtext for review by", review.name, "is:", review.reviewtext)
            return {children: <Slide name={review.name} time={review.time} stars={review.stars} photo={review.photo} reviewtext={review.reviewtext} isyelp={review.yelp} />}
        }))
    }, [])
    // useEffect(() => {
    // }, [reviews])
    useEffect(() => {
        console.log("slider arr is:", sliderarr)
    }, [sliderarr])
    // const AutoplaySlider = withAutoplay(AwesomeSlider);
    return (
        <AwesomeSlider
            id="midslideshow"
            bullets={false}
            play={true}
            cancelOnInteraction={false} // should stop playing on user interaction
            interval={6000}
            media={sliderarr}
            onTransitionStart={(e) => {
                document.getElementsByClassName("awssld--foldOutAnimation")[0].style.height = heightFirstRender;
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