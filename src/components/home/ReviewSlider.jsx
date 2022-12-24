import React, { useEffect, useState } from "react";
import AwesomeSlider from 'react-awesome-slider';
import withAutoplay from 'react-awesome-slider/dist/autoplay';
import 'react-awesome-slider/dist/styles.css';
import '../../assets/css/reviewslider.css';
import Slide from "./Slide";

export default function ReviewSlider({reviews}) {
    const [sliderarr, setSliderArr] = useState([])
    const [heightFirstRender, setHeightFirstRender] = useState(null);
    useEffect(() => {
        setHeightFirstRender(document.getElementsByClassName("awssld--organic-arrows")[0].style.height);
    }, [])
    useEffect(() => {
        console.log("reviews", reviews)
        setSliderArr(reviews.map((review) => {
            return {children: <Slide photo={review.photo} name={review.name} reviewtext={review.reviewtext} stars={review.stars} time={review.time} />}
        }))
    }, [reviews])
    const AutoplaySlider = withAutoplay(AwesomeSlider);
    return (
        <AutoplaySlider
            id="midslideshow"
            bullets={false}
            play={true}
            cancelOnInteraction={false} // should stop playing on user interaction
            interval={6000}
            media={sliderarr}
            onTransitionStart={(e) => {
                console.log("transition end", e)
                document.getElementsByClassName("awssld--organic-arrows")[0].style.height = heightFirstRender;
            }}
        />
    )
}