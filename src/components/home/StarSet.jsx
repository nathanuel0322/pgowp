import Star from '../../assets/icons/star.svg';
import EmptyStar from '../../assets/icons/emptystar.svg';
import HalfStar from '../../assets/icons/halfstar.svg';

export default function StarSet({num}) {
    console.log("num", num)
    return (
        <div title="RatingBar__Container" className="ecFtME">
            {[1, 2, 3, 4, 5].map((star, index) => {
                console.log("for index:", index+", num is:", num, "star is:", star);
                console.log(num > star)
                return (
                    <div title="RatingItemFilledSvg__Container" className="hoAzGt es-rating-stars-item-filled" key={index}>
                        {num >= star ?
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled" className="chMKQB bFQRJO">
                                <img src={Star} alt="filledstar" />
                            </div>
                        :
                        num === star - 0.5 ?
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Half" className="chMKQB bFQRJO">
                                <img src={HalfStar} alt="filledstar" />
                            </div>
                        :
                        num < star - 0.5 &&
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Empty" className="chMKQB biFvfu">
                                <img src={EmptyStar} alt="filledstar" />
                            </div>
                        }
                    </div>
                )
            })}
        </div>
    )
}