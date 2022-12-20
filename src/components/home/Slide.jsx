import '../../assets/css/slide.css';
export default function Slide({name, time, stars, photo, reviewtext}) {
    return (
        <div id="slideparent" style={{display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <div id="topdiv">
                <img src={photo} alt="reviewer" />
                <div id="namestarts">
                    <p>{name}</p>
                    <p><span>{stars}</span>{time}</p>
                </div>
            </div>
            <div id="reviewtext">
                <p>{reviewtext}</p>
            </div>
        </div>
    )
}