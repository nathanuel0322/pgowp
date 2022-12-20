import React, { useEffect, useState } from "react";
import AwesomeSlider from 'react-awesome-slider';
import withAutoplay from 'react-awesome-slider/dist/autoplay';
import 'react-awesome-slider/dist/styles.css';
import '../../assets/css/reviewslider.css';
import Slide from "./Slide";

export default function ReviewSlider({reviews}) {
    const [sliderarr, setSliderArr] = useState([])
    useEffect(() => {
        console.log("reviews", reviews)
        setSliderArr(reviews.map((review) => {
            return {children: <Slide photo={review.photo} name={review.name} reviewtext={review.reviewtext} />}
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
        />
    )
}