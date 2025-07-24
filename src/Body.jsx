import sampleVideo from './assets/stock9.mp4';

// VideoBackground.jsx
const VideoBackground = () => {
    return (
      <div className="background-wrapper">
        <video autoPlay loop muted playsInline className="background-video">
          <source src={sampleVideo} type="video/mp4" />
        </video>
        <div className="content-overlay">
          {/* Your content goes here */}
        </div>
      </div>
    );
  };
  
  export default VideoBackground;