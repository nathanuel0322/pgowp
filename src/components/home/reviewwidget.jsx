import React, { useEffect, useState } from 'react';
import '../../assets/css/reviewwidget.css';
import Yelp5Stars from '../../assets/icons/regular_5@3x.png';
import Star from '../../assets/icons/star.svg';
import HalfStar from '../../assets/icons/halfstar.svg';
import ReviewSlider from './ReviewSlider';
import { ProgressBar, ThreeDots } from 'react-loader-spinner';
import StarSet from './StarSet';
import { useMediaQuery } from 'react-responsive';
import { ReactComponent as GoogleIcon } from '../../assets/icons/googleicon.svg';
import { ReactComponent as YelpIcon } from '../../assets/icons/yelpicon.svg';
import { ReactComponent as GoogleRating } from '../../assets/icons/googlerating.svg';
import { ReactComponent as YelpRating } from '../../assets/icons/yelprating.svg';
// height: 40px;
export default function ReviewWidget() {
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
  const mobile = useMediaQuery({query: '(min-width: 320px)'});
  const tablet = useMediaQuery({query: '(min-width: 768px)'});
  const laptopsize = useMediaQuery({query: '(min-width: 1024px)'});

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
              reviewavg: Math.round(([...yelpdata, ...googledata].reduce((accumulator, currentValue) => accumulator + currentValue.stars, 0) / (yelpdata.length + googledata.length)) * 10) / 10 
            });
            setApiLoaded(true);
          })
      });
  }, []);

  // awssld__container -> rate: 1.66836475 

  useEffect(() => {
    console.log("reviewavg is:", reviewobj.reviewavg);
  }, [reviewobj.reviewavg]);

  return (
    <div id="parentdiv">
      <p id='reviewsubtitle' className='text-xl font-bold text-white'>Check out our reviews from past customers below!</p>
      <div id='TopReviewsContainer' className="eyarYd" style={{width: (laptopsize || tablet) && '55%', margin: (laptopsize || tablet) && '1rem auto'}}>
        <div id='TabsContainer_Inner' className='eyarYd kaXWRJ cFMrET'>
          <div id='TabsSlider_Inner' className='kWhNOk'>
            <div id='Tab_AllReviews' className='reviewtabs gbMejj'>
              <div id='Tab_Container' className="hLJjKZ eSqAQ" onClick={() => {
                  setReviewObj({...reviewobj, googleSelected: false, yelpSelected: false, allReviewsSelected: true})
                }}
                style={{}}
              >
                <div id='Tab_Inner' className='fYHkoy'>
                  <span id='TabTitle__Container' className="fvcFQJ">All Reviews</span>
                  <div id="RatingValue__Container" className='hlAsxU'>
                    5.0
                  </div>
                </div>
              </div>
              {/* {reviewobj.allReviewsSelected ? 
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
              } */}
            </div>
            <div id='Tab_Google' className='reviewtabs gbMejj'>
              <div id='Tab_Container' className="hLJjKZ eSqAQ" onClick={() => {
                setReviewObj({...reviewobj, googleSelected: true, yelpSelected: false, allReviewsSelected: false})
              }}>
                <div id="Tab__Inner" className="fYHkoy">
                  <div title="Google">
                    <div>
                      <GoogleIcon />
                    </div>
                  </div>
                  <span id="Tab__StyledTabTitle" className="fvcFQJ hHDmip">Google</span>
                  <div id="RatingValue__Container" className="hlAsxU">
                    5.0
                  </div>
                </div>
              </div>
              {/* {reviewobj.googleSelected ? 
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
              } */}
            </div>
            <div id='Tab_Yelp' className='reviewtabs gbMejj'>
              <div id='Tab_Container' className="hLJjKZ eSqAQ" onClick={() => {
                setReviewObj({...reviewobj, googleSelected: false, yelpSelected: true, allReviewsSelected: false})
              }}>
                <div id="Tab__Inner" className="fYHkoy">
                  <div title="Yelp" id="Icon__IconContainer" className='dosZLJ'>
                    <YelpIcon />
                  </div>
                  <span id="Tab__StyledTabTitle" className="fvcFQJ hHDmip">Yelp</span>
                  <div id="RatingValue__Container" className="hlAsxU">
                    5.0
                  </div>
                </div>
              </div>
              {/* {reviewobj.yelpSelected ? 
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
              } */}
            </div>
          </div>
        </div>
        <div title="HeaderContainer__Inner Header__StyledHeaderContainer LayoutDefault__StyledHeader" className="fFcWqO ezwNNr">
          <div title="Header__Info" className="ifLRlC">
            <div title="HeaderTitle__Container" className="dmlKKH">
              {reviewobj.allReviewsSelected ?
                <div className="dmlKKH">
                  <div title="HeaderTitle__Text" className="cOdTFM">
                    Overall Rating
                  </div>
                </div>
              :
                reviewobj.googleSelected ?
                  <div className="dmlKKH">
                    <div id="Google" title="Icon__IconContainer HeaderTitle__StyledSourceLogo" className="dosZLJ cMwniS" style={{width: 'auto', height: '40px',}}>
                      <div>
                        <GoogleRating height={40} />
                      </div>
                    </div>
                    <div title="HeaderTitle__Text" className="cOdTFM">
                      Rating
                    </div>
                  </div>
                :
                  reviewobj.yelpSelected &&
                    <div className="dmlKKH">
                      <div id="Yelp" title="Icon__IconContainer HeaderTitle__StyledSourceLogo" className="dosZLJ cMwniS" style={{width: 'auto', 
                          height: '40px',
                      }}>
                        <YelpRating height={40} />    
                      </div>
                      <div title="HeaderTitle__Text" className="cOdTFM">
                        Rating
                      </div>
                    </div>
              }
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
                  <div title="RatingValue__Container" id='ratingnum' className="bIDTiT font-bold">
                    {String(reviewobj.reviewavg).split(".").length > 1 ? reviewobj.reviewavg : reviewobj.reviewavg + ".0"}
                  </div>
                  {reviewobj.yelpSelected ?
                    <div>
                      <img src={Yelp5Stars} alt="yelpstars" width={100} height={20}/>
                    </div>
                  :
                    <div title="RatingBar__Container" className="ecFtME">
                      {[0,1,2,3,4].map((item, index) => {
                        return(
                          <div title="RatingItemFilledSvg__Container" className="hoAzGt es-rating-stars-item-filled" key={index}>
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Unfilled" className="chMKQB bFQRJO">
                              <img src={Star} alt="filledstar" />
                            </div>
                            <div title="RatingItemFilledSvg__ContainerAbsolute RatingItemFilledSvg__Filled" className="chMKQB biFvfu">
                              <img src={Star} alt="filledstar" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  }
                  <div className="HeaderTotalReviews__Container-sc-1a7tbil-0 eaRlNB">
                    {reviewobj.allReviewsSelected ? reviewobj.googlereviews.length + reviewobj.yelpreviews.length : reviewobj.googleSelected ? reviewobj.googlereviews.length : reviewobj.yelpreviews.length} reviews
                  </div>
                </div>
              }
            </div>
          </div>
          <button size="15" id='writereview' type="button"
            onClick={() => {
              // open google maps page in new tab
              window.open(reviewobj.yelpSelected ? 'https://www.yelp.com/writeareview/biz/hk7BNtXuUG2YdkAIjehMjQ?return_url=%2Fbiz%2Fhk7BNtXuUG2YdkAIjehMjQ&review_origin=biz-details-war-button' : 'https://www.google.com/search?hl=en-US&gl=us&q=Prestigious+Gaming+On+Wheels+Plus,+13210+154th+St,+Queens,+NY+11434&ludocid=8635943149184468988&lsig=AB86z5UQXhJCg5YNNsAkTIaa8xBp#lrd=0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc,3');
            }}
          >
            Write a Review
          </button>
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
            <ReviewSlider
              reviews={reviewobj.allReviewsSelected ?
                [...reviewobj.googlereviews, ...reviewobj.yelpreviews] 
              : reviewobj.googleSelected ?
                  reviewobj.googlereviews
                :
                  reviewobj.yelpreviews}
            />
          }
        </div>
      </div>
    </div>
  )
}