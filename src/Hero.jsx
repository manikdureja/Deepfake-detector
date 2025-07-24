import { useRef, useEffect, useState } from "react";
import sampleimage from "./assets/image_st2.png";
import samplevideo from "./assets/stock7.mp4";
import { supabase } from "./supabaseClient"; // Import Supabase client

const Hero = () => {
  const videoRef = useRef(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        // Get the auth token from local storage
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        // Decode the token to extract the user ID
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode the JWT payload
        const userId = payload.sub; // Extract the user ID (subject)

        // Fetch user data from the database
        const { data: userData, error: userError } = await supabase
          .from("user") // Replace 'user' with your table name
          .select("name")
          .eq("id", userId)
          .single();

        if (userError) throw userError;

        setUserName(userData.name); // Set the user's name
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };

    fetchUserName();
  }, []);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play(); // Play the video when hovered
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause(); // Pause the video when hover ends
      videoRef.current.currentTime = 0; // Reset to the beginning
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        {userName ? <><h2>Hi {userName}</h2> <h2>Detect Deepfakes with AI</h2></>: <h2>Detect Deepfakes with AI</h2>}
        <p>Upload images or videos to analyze for potential manipulation</p>
        <div
          className="media-container"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img src={sampleimage} alt="Hero Image" className="hero-image" />
          <video
            ref={videoRef}
            src={samplevideo}
            className="hero-video"
            muted
            loop
            playsInline
          ></video>
        </div>
      </div>
    </section>
  );
};

export default Hero;