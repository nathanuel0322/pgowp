import Star from '../../assets/icons/star.svg';
import EmptyStar from '../../assets/icons/emptystar.svg';
import HalfStar from '../../assets/icons/halfstar.svg';

export default function StarSet({num}) {
    console.log("num", num)
    // loop through num and render stars using a map function
    // if num is 3.5, render 3 full stars, 1 half star, and 1 empty star
    // if num is 2.5, render 2 full stars, 1 half star, and 2 empty stars
    // if num is 1.5, render 1 full star, 1 half star, and 3 empty stars
    // if num is 0.5, render 1 half star and 4 empty stars
    // if num is 0, render 5 empty stars
    return (
        <div title="RatingBar__Container" className="ecFtME">
            {[1, 2, 3, 4, 5].map((star, index) => {
                return (
                    <div title="RatingItemFilledSvg__Container" className="hoAzGt es-rating-stars-item-filled" key={index}>
                        {num >= star &&
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Unfilled" className="chMKQB bFQRJO">
                                <img src={Star} alt="filledstar" />
                            </div>
                        }
                        {num === star - 0.5 &&
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Half" className="chMKQB bFQRJO">
                                <img src={HalfStar} alt="filledstar" />
                            </div>
                        }
                        {num < star - 0.5 &&
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled" className="chMKQB biFvfu">
                                <img src={EmptyStar} alt="filledstar" />
                            </div>
                        }
                    </div>
                )
            })}
        </div>
    )
}