import React, { useEffect, useState } from 'react';
import '../../assets/css/reviewwidget.css';
import OverallRating from './OverallRating';
import YelpRating from './YelpRating';
import GoogleRating from './GoogleRating';
import Yelp5Stars from '../../assets/icons/regular_5@3x.png';
import Star from '../../assets/icons/star.svg';
import HalfStar from '../../assets/icons/halfstar.svg';
import ReviewSlider from './ReviewSlider';
import { ProgressBar, ThreeDots } from 'react-loader-spinner';
import StarSet from './StarSet';

export default function GetRequest() {
  const [reviewobj, setReviewObj] = useState({
    allReviewsSelected: true,
    googleSelected: null,
    googlereviews: [],
    yelpreviews: [],
    yelpSelected: null,
    yelplength: null,
    yelpreviewaverage: null,
    googlereviewavg: null,
    reviewavg: null
  });
  const [apiLoaded, setApiLoaded] = useState(false);

  useEffect(() => {
    fetch('https://yelpapi.herokuapp.com/google')
      .then((googleresponse) => googleresponse.json())
      // set the googlereviews array in reviewobj to the response data
      .then((googledata) => {
        console.log("google api data:", googledata);
        fetch('https://yelpapi.herokuapp.com/yelp')
          .then((yelpresponse) => yelpresponse.json())
          .then((yelpdata) => {
            console.log("yelp data:", yelpdata);
            console.log("yelpdata length:", yelpdata.length);
            console.log("googledata length:", googledata.length);
            setReviewObj({
              ...reviewobj,
              yelpreviews: yelpdata,
              yelpreviewaverage: Math.round((yelpdata.reduce((accumulator, currentValue) => accumulator + currentValue.rating, 0) / yelpdata.length) * 10) / 10,
              googlereviews: googledata,
              googlereviewavg: Math.round((googledata.reduce((accumulator, currentValue) => accumulator + currentValue.stars, 0) / googledata.length) * 10) / 10,
              reviewavg: Math.round(([...yelpdata, ...googledata].reduce((accumulator, currentValue) => {
                console.log("accumulator is:", accumulator, "currentValue is:", currentValue);
                return(accumulator + currentValue.stars)
              }, 0) / (yelpdata.length + googledata.length)) * 10) / 10 
            });
            setApiLoaded(true);
          })
      });
  }, []);

  useEffect(() => {
    console.log("reviewavg is:", reviewobj.reviewavg);
  }, [reviewobj.reviewavg]);

  return (
    <div id="parentdiv">
      <p id='reviewsubtitle' className='text-xl font-bold text-white'>Check out our reviews from past customers below!</p>
      <div id='TopReviewsContainer' className="eyarYd">
        <div id='TabsContainer_Inner' className='eyarYd kaXWRJ cFMrET'>
          <div id='TabsSlider_Container' className='iluRKv' >
            <div id='TabsSlider_Inner' className='kWhNOk'>
              <div id='Tab_AllReviews' className='reviewtabs gbMejj' style={{transform: 'translate3d(0px, 0px, 0px)'}}>
                <div id='Tab_Container' className="hLJjKZ eSqAQ" onClick={() => {
                  setReviewObj({...reviewobj, googleSelected: false, yelpSelected: false, allReviewsSelected: true})
                }}>
                  <div id='Tab_Inner' className='fYHkoy'>
                    <span id='TabTitle__Container' className="fvcFQJ">All Reviews</span>
                    <div id="Rating__Container" className='kqGYQX fdNGvL'>
                      <div id="RatingValue__Container" className='hlAsxU'>
                        5.0
                      </div>
                    </div>
                  </div>
                </div>
                {reviewobj.allReviewsSelected ? 
                  <div style={{
                    position: 'absolute',
                    fontSize: 500,
                    display: 'block',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                    height: '2px',
                    transform: 'translate(0px, 0px) scaleY(1)',
                    transformOrigin: '50% 100%',
                    backgroundColor: 'rgb(17, 17, 17)',
                    content: "",
                  }}>
                  </div>
                :
                  <div></div>
                }
              </div>
              <div id='Tab_Google' className='reviewtabs gbMejj' style={{transform: 'translate3d(0px, 0px, 0px)'}}>
                <div id='Tab_Container' className="hLJjKZ eSqAQ" onClick={() => {
                  setReviewObj({...reviewobj, googleSelected: true, yelpSelected: false, allReviewsSelected: false})
                }}>
                  <div id="Tab__Inner" className="fYHkoy">
                    <div title="Google" id="Icon__IconContainer" className='dosZLJ' style={{width: '24px', height: '24px'}}>
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path fill="#2A84FC" d="M21.579 12.234c0-.677-.055-1.358-.172-2.025h-9.403v3.839h5.384a4.615 4.615 0 01-1.992 3.029v2.49h3.212c1.886-1.736 2.97-4.3 2.97-7.333z"></path>
                          <path fill="#00AC47" d="M12.004 21.974c2.688 0 4.956-.882 6.608-2.406l-3.213-2.491c-.893.608-2.047.952-3.392.952-2.6 0-4.806-1.754-5.597-4.113H3.095v2.567a9.97 9.97 0 008.909 5.491z"></path>
                          <path fill="#FFBA00" d="M6.407 13.916a5.971 5.971 0 010-3.817V7.53H3.095a9.977 9.977 0 000 8.952l3.312-2.567z"></path><path fill="#FC2C25" d="M12.004 5.982a5.417 5.417 0 013.824 1.494l2.846-2.846a9.581 9.581 0 00-6.67-2.593A9.967 9.967 0 003.095 7.53l3.312 2.57c.787-2.363 2.996-4.117 5.597-4.117z"></path>
                        </svg>
                      </div>
                    </div>
                    <span id="Tab__StyledTabTitle" className="fvcFQJ hHDmip">Google</span>
                    <div id="Rating__Container" className="kqGYQX fdNGvL">
                      <div id="RatingValue__Container" className="hlAsxU">
                        5.0
                      </div>
                    </div>
                  </div>
                </div>
                {reviewobj.googleSelected ? 
                  <div style={{
                    position: 'absolute',
                    fontSize: 500,
                    display: 'block',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                    height: '2px',
                    transform: 'translate(0px, 0px) scaleY(1)',
                    transformOrigin: '50% 100%',
                    backgroundColor: 'rgb(17, 17, 17)',
                    content: "",
                  }}>
                  </div>
                :
                <div></div>              
                }
              </div>
              <div id='Tab_Yelp' className='reviewtabs gbMejj' style={{transform: 'translate3d(0px, 0px, 0px)'}}>
                <div id='Tab_Container' className="hLJjKZ eSqAQ" onClick={() => {
                  setReviewObj({...reviewobj, googleSelected: false, yelpSelected: true, allReviewsSelected: false})
                }}>
                  <div id="Tab__Inner" className="fYHkoy">
                    <div title="Yelp" id="Icon__IconContainer" className='dosZLJ' style={{width: '24px', height: '24px'}}>
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path fill="#D42322" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                          <path fill="#fff" d="M10.947 14.399c.308-.395 1.02-.144.999.366 0 .12.005 3.025-.043 3.159-.06.155-.18.252-.366.29-.258.045-.694-.049-1.306-.278-.563-.21-1.45-.559-1.261-1.105.071-.178 1.315-1.632 1.977-2.432zm2.123.096c-.28-.42.174-1.035.655-.863 0 0 2.828.928 2.935 1.024.134.106.184.254.157.444-.07.536-1.14 1.908-1.633 2.105-.177.068-.33.053-.454-.051-.127-.091-1.581-2.524-1.66-2.66zm-5.416-3.296c.122 0 1.717.673 2.884 1.154.438.176.476.93-.038 1.088-.026.009-2.795.928-2.964.929-.388-.023-.473-.42-.509-.81a6.065 6.065 0 01.008-1.217c.048-.489.14-1.173.619-1.144zm7.157-2.137c.133-.093.29-.098.468-.015.47.228 1.41 1.64 1.47 2.199-.003.075.03.304-.19.457-.144.096-2.837.733-3.023.796l.008-.016c-.463.122-.905-.48-.596-.9.094-.095 1.686-2.401 1.863-2.52zM8.188 6.034c.4-.429 2.544-1.035 3.11-.886.192.049.31.158.353.327.033.217.294 4.352.33 5.006l.003.094c-.001.915-.673 1.138-1.21.278L8.052 6.486a.467.467 0 01.135-.452z"></path>
                        </svg>
                      </div>
                    </div>
                    <span id="Tab__StyledTabTitle" className="fvcFQJ hHDmip">Yelp</span>
                    <div id="Rating__Container" className="kqGYQX fdNGvL">
                      <div id="RatingValue__Container" className="hlAsxU">
                        5.0
                      </div>
                    </div>
                  </div>
                </div>
                {reviewobj.yelpSelected ? 
                  <div style={{
                    position: 'absolute',
                    fontSize: 500,
                    display: 'block',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                    height: '2px',
                    transform: 'translate(0px, 0px) scaleY(1)',
                    transformOrigin: '50% 100%',
                    backgroundColor: 'rgb(17, 17, 17)',
                    content: "",
                  }}>
                  </div>
                :
                <div></div>              
                }
              </div>
            </div>
          </div>
        </div>
        <div title="HeaderContainer__Inner Header__StyledHeaderContainer LayoutDefault__StyledHeader" className="fFcWqO ezwNNr">
          <div title="Header__Info" className="ifLRlC">
            <div title="HeaderTitle__Container" className="dmlKKH">
              {reviewobj.allReviewsSelected && <OverallRating />}
              {reviewobj.googleSelected && <GoogleRating />}
              {reviewobj.yelpSelected && <YelpRating />}
            </div>
            <div title="Header__SourceInfo" className="fctGyX">
              {!apiLoaded ?
                <div title="Rating__Container Header__StyledHeaderRating" className="kqGYQX bJFeVI">
                  <ThreeDots 
                    height="40" 
                    width="40" 
                    radius="9"
                    color="blue" 
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClassName=""
                    visible={true}
                  />
                </div>
              :
                <div title="Rating__Container Header__StyledHeaderRating" className="kqGYQX bJFeVI">
                  <div title="RatingValue__Container" className="bIDTiT font-bold" style={{marginRight: '13px'}}>
                    {String(reviewobj.reviewavg).split(".").length > 1 ? reviewobj.reviewavg : reviewobj.reviewavg + ".0"}
                  </div>
                  {reviewobj.yelpSelected ?
                    <div>
                      <img src={Yelp5Stars} alt="yelpstars" width={100} height={20}/>
                    </div>
                  :
                  <div title="RatingBar__Container" className="ecFtME">
                  <div title="RatingItemFilledSvg__Container" className="hoAzGt es-rating-stars-item-filled">
                    <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Unfilled" className="chMKQB bFQRJO">
                      <img src={Star} alt="filledstar" />
                    </div>
                    <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled" className="chMKQB biFvfu">
                      <img src={Star} alt="filledstar" />
                    </div>
                  </div>
                  <div title="RatingItemFilledSvg__Container" className="hoAzGt es-rating-stars-item-filled">
                    <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Unfilled" className="chMKQB bFQRJO">
                      <img src={Star} alt="filledstar" />
                    </div>
                    <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled" className="chMKQB biFvfu">
                      <img src={Star} alt="filledstar" />
                    </div>
                  </div>
                  <div title="RatingItemFilledSvg__Container" className="hoAzGt es-rating-stars-item-filled">
                    <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Unfilled" className="chMKQB bFQRJO">
                      <img src={Star} alt="filledstar" />
                    </div>
                    <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled" className="chMKQB biFvfu">
                      <img src={Star} alt="filledstar" />
                    </div>
                  </div>
                  <div title="" className="RatingItemFilledSvg__Container hoAzGt es-rating-stars-item-filled">
                    <div title="" className="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Unfilled chMKQB bFQRJO">
                      <img src={Star} alt="filledstar" />
                    </div>
                    <div title="" className="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled chMKQB biFvfu">
                      <img src={Star} alt="filledstar" />
                    </div>
                  </div>
                  <div title="" className="RatingItemFilledSvg__Container hoAzGt es-rating-stars-item-filled">
                    <div title="" className="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Unfilled chMKQB bFQRJO">
                      <img src={Star} alt="filledstar" />
                    </div>
                    <div title="" className="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled chMKQB biFvfu">
                      <img src={Star} alt="filledstar" />
                    </div>
                  </div>
                </div>
                  }
                  <div style={{paddingLeft: '13px',  whiteSpace: 'nowrap'}} className="HeaderTotalReviews__Container-sc-1a7tbil-0 eaRlNB">
                    {reviewobj.allReviewsSelected ? reviewobj.googlereviews.length + reviewobj.yelpreviews.length : reviewobj.googleSelected ? reviewobj.googlereviews.length : reviewobj.yelpreviews.length} reviews
                  </div>
                </div>
              }
            </div>
          </div>
          <div title="" className="HeaderWriteReviewButton__Component-sc-aghmpr-0 bOCgQx Header__StyledHeaderWriteReviewButton-sc-gozq6j-4 iXyBKR">
            <button size="15" id='writereview' className="ButtonBase__ButtonContainer-sc-p43e7i-3 fhFXwt HeaderWriteReviewButton__StyledButton-sc-aghmpr-1 dYQPWG" type="button" tabIndex="0" style={{borderRadius: '4px', borderColor: 'rgba(0, 0, 0, 0)', color: 'rgb(255, 255, 255)', fontFamily: 'inherit', backgroundColor: 'rgb(25, 123, 255)', height: '35px'}} 
              onClick={() => {
                // open google maps page in new tab
                window.open(reviewobj.yelpSelected ? 'https://www.yelp.com/writeareview/biz/hk7BNtXuUG2YdkAIjehMjQ?return_url=%2Fbiz%2Fhk7BNtXuUG2YdkAIjehMjQ&review_origin=biz-details-war-button' : 'https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6716126,-73.7834678,20.21z/data=!4m5!3m4!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759');
              }}
            >
              <span className="ButtonBase__Overlay-sc-p43e7i-4 fMszQs" style={{padding: '8px 20px', backgroundColor: 'rgba(0, 0, 0, 0)'}}>
                Write a Review
              </span>
            </button>
          </div>
        </div>
        <div id="slidercontainer">
          {!apiLoaded ?
            <ProgressBar
              height="80"
              width="80"
              ariaLabel="progress-bar-loading"
              wrapperStyle={{margin: '0 auto'}}
              wrapperClass="progress-bar-wrapper"
              borderColor = 'blue'
              barColor = 'orange'
            />
          :
            <ReviewSlider reviews={reviewobj.allReviewsSelected ? [...reviewobj.googlereviews, ...reviewobj.yelpreviews] : reviewobj.googleSelected ? reviewobj.googlereviews : reviewobj.yelpreviews} />
          }
        </div>
      </div>
    </div>
  )
}
