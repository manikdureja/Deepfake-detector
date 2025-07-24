import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Body from './Body';
import Header from './HeaderB';
import Footer from './Footer';

const Profile = () => {
  const [user, setUser] = useState(null); // State to store user information
  const [loading, setLoading] = useState(true); // State to handle loading
  const [media, setMedia] = useState([]); // State to store media files
  const [filter, setFilter] = useState(''); // State to filter media (real or fake)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get the auth token from local storage
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token found.');
        }

        // Decode the token to extract the user ID
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode the JWT payload
        const userId = payload.sub; // Extract the user ID (subject)

        // Fetch user data from the database
        const { data: userData, error: userError } = await supabase
          .from('user') // Replace 'user' with your table name
          .select('name, email')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUser(userData); // Set user data

        // Fetch media files from the history table
        const { data: mediaData, error: mediaError } = await supabase
          .from('history')
          .select('file_path, result')
          .eq('user_id', userId);

        if (mediaError) throw mediaError;

        // Generate public URLs for media files
        const mediaWithUrls = mediaData.map((item) => {
          const { data } = supabase.storage.from('storage').getPublicUrl(item.file_path); // Replace 'storage' with your bucket name
          return { ...item, publicUrl: data.publicUrl };
        });

        setMedia(mediaWithUrls); // Set media files with public URLs
      } catch (error) {
        console.error('Error fetching user data or media:', error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchUser();
  }, []);

  const handleFilter = (type) => {
    setFilter(type); // Set the filter to 'real' or 'fake'
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading state
  }

  if (!user) {
    return <div>No user data found.</div>; // Handle case where no user data is found
  }

  // Filter media based on the selected filter
  const filteredMedia = filter
    ? media.filter((item) => item.result === filter)
    : media;

  const renderMedia = (filePath, publicUrl) => {
    const fileExtension = filePath.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      // Render image
      return <img src={publicUrl} alt="Media" />;
    } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
      // Render video
      return (
        <video controls>
          <source src={publicUrl} type={`video/${fileExtension}`} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      // Render as a fallback link for unsupported file types
      return (
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          {filePath}
        </a>
      );
    }
  };

  return (
    <>
    <Body />
    <Header />
    <div className="profile-container">
      <h2>User Profile</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <div className="media-section">
        <h3>Analysis History</h3>
        <div className="filter-buttons">
          <button onClick={() => handleFilter('real')}>Real</button>
          <button onClick={() => handleFilter('fake')}>Fake</button>

        </div>
        </div>
        <div className="media-list">
          {filteredMedia.length > 0 ? (
            filteredMedia.map((item, index) => (
              <div key={index} className="media-item">
                {renderMedia(item.file_path, item.publicUrl)}
              </div>
            ))
          ) : (
            <p>No media found for the selected filter.</p>
          )}
        </div>
      
    </div>
    <Footer />
    </>
  );
};

export default Profile;