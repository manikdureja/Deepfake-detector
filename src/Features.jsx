import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Logo_r from './assets/Logo_r.png';
import Logo_f from './assets/Logo_f.png';
import Logo from './assets/logo.png';
import { supabase } from './supabaseClient';

const favicon = document.querySelector("link[rel='icon']");

const FeatureCard = ({ icon, title, description, onSelect }) => (
  <div className="feature-card" onClick={onSelect}>
    <div className="icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const FaceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="10" r="1" />
    <circle cx="16" cy="10" r="1" />
    <path d="M9 16c.5 1 1.5 2 3 2s2.5-1 3-2" />
  </svg>
);

const Features = ({ searchQuery }) => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const features = [
    {
      id: 'image',
      icon: <ImageIcon />,
      title: 'Image Analysis',
      description: 'Detect manipulated images using facial analysis',
      acceptedTypes: 'image/*',
    },
    {
      id: 'video',
      icon: <VideoIcon />,
      title: 'Video Detection',
      description: 'Analyze video frames with facial recognition',
      acceptedTypes: 'video/*',
    },
  ];

  const handleDrop = async (acceptedFiles) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);
  
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
  
      const formData = new FormData();
      formData.append('file', file);
  
      // Determine the API endpoint based on the selected feature
      const apiUrl = selectedFeature.id === 'image'
        ? 'http://localhost:5000/api/analyze/image'
        : 'http://localhost:5000/api/analyze/video';
  
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
  
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
  
      // Handle response
      xhr.onload = async function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          setAnalysisResult(data);
  
          // Determine the folder based on the result
          const folder = data.is_deepfake === 1 ? 'fake' : 'real';
  
          // Check if the user is logged in
          const authToken = localStorage.getItem('authToken');
          if (authToken) {
            try {
              // Upload the media to Supabase storage
              const filePath = `${folder}/${Date.now()}.${file.name}`;
              const { error: uploadError } = await supabase.storage
                .from('storage') // Replace 'storage' with your bucket name
                .upload(filePath, file);
  
              if (uploadError) {
                throw new Error('Failed to upload media to storage');
              }
  
              // Insert entry into the history table
              const userId = JSON.parse(atob(authToken.split('.')[1])).sub; // Decode user ID from token
              const { error: insertError } = await supabase
                .from('history')
                .insert({
                  user_id: userId,
                  file_path: filePath,
                  media: selectedFeature.id,
                  result: data.is_deepfake === 1 ? 'fake' : 'real',
                });
  
              if (insertError) {
                throw new Error('Failed to insert entry into history table');
              }
            } catch (error) {
              console.error('Error storing media or history:', error);
              setError('Failed to store media or history.');
            }
          } else {
            console.log('User is not logged in. Media will not be stored.');
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            throw new Error(errorData.error || 'Server error occurred');
          } catch (e) {
            throw new Error('Server error occurred');
          }
        }
        setIsLoading(false);
      };
  
      // Handle errors
      xhr.onerror = function () {
        setError('Network error occurred');
        setIsLoading(false);
      };
  
      // Open and send the request
      xhr.open('POST', apiUrl, true);
      xhr.send(formData);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Effect to update favicon and title dynamically based on analysis result
  useEffect(() => {
    if (analysisResult) {
      if (analysisResult.is_deepfake === 1) {
        document.title = 'Fake';
        favicon.href = Logo_f;
      } else if (analysisResult.is_deepfake === 0) {
        document.title = 'Real';
        favicon.href = Logo_r;
      } else {
        // No face detected
        document.title = 'No Face Detected';
        favicon.href = Logo;
      }
    } else {
      document.title = 'Deep Fake Detector';
      favicon.href = Logo;
    }
  }, [analysisResult]);

  // Clean up object URL when component unmounts or when a new file is selected
  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const UploadModal = ({ onClose }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: handleDrop,
      accept: selectedFeature.id === 'image'
        ? {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
          }
        : {
            'video/mp4': ['.mp4'],
            'video/x-msvideo': ['.avi'],
            'video/quicktime': ['.mov']
          },
      maxSize: selectedFeature.id === 'image' ? 10485760 : 104857600, // 10MB for images, 100MB for videos
    });

    return (
      <div className="upload-modal">
        <div className="modal-content">
          <h3>Upload For {selectedFeature.title}</h3>
          <div className="upload-preview-container">
            <div
              {...getRootProps({
                className: `dropzone ${isDragActive ? 'drag-active' : ''}`,
              })}
            >
              <input {...getInputProps()} />
              <div className="dropzone-content">
                <FaceIcon />
                {isDragActive ? (
                  <p>Drop the files here...</p>
                ) : (
                  <>
                    <p>Drag & drop files here, or click to select files</p>
                    <small>
                      {selectedFeature.id === 'image' 
                        ? 'Supports JPG, JPEG, PNG (max 10MB)' 
                        : 'Supports MP4, AVI, MOV (max 100MB)'}
                    </small>
                  </>
                )}
              </div>
            </div>

            <div className="modal-body">
              {isLoading && (
                <div className="loading-container">
                  <p className="loading">Analyzing{selectedFeature.id === 'video' ? ' frames' : ''}...</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${uploadProgress}%`}}
                    ></div>
                  </div>
                  <p className="progress-text">{uploadProgress}% uploaded</p>
                </div>
              )}
              
              {error && <p className="error">{error}</p>}

              {/* Media preview */}
              {mediaPreview && (
                <div className="preview">
                  {selectedFeature.id === 'image' ? (
                    <img src={mediaPreview} alt="Preview" />
                  ) : (
                    <video src={mediaPreview} controls width="100%" />
                  )}
                </div>
              )}

              {analysisResult && !error && (
                <div className={`result ${analysisResult.is_deepfake === -1 ? 'warning' : ''}`}>
                  <h4>Analysis Result:</h4>
                  
                  {analysisResult.is_deepfake === -1 ? (
                    <>
                      <p className="warning-text">
                        <FaceIcon /> No faces detected
                      </p>
                      <p>{analysisResult.message}</p>
                    </>
                  ) : analysisResult.is_deepfake === 1 ? (
                    <>
                      <p className="fake-text">The {selectedFeature.id === 'image' ? 'Image' : 'Video'} Is Fake</p>
                      <p>
                        Confidence: {(analysisResult.confidence * 100).toFixed(2)}%
                      </p>
                      {analysisResult.message && <p className="message-text">{analysisResult.message}</p>}
                    </>
                  ) : (
                    <>
                      <p className="real-text">The {selectedFeature.id === 'image' ? 'Image' : 'Video'} Is Real</p>
                      <p>
                        Confidence: {((1 - analysisResult.confidence) * 100).toFixed(2)}%
                      </p>
                      {analysisResult.message && <p className="message-text">{analysisResult.message}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="button-group">
            <button
              className="Drop-close"
              onClick={() => {
                onClose();
                setMediaPreview(null);
                if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                favicon.href = Logo;
                document.title = 'Deep Fake Detector';
              }}
            >
              Close
            </button>
            {!isLoading && mediaPreview && (
              <button
                className="Drop-retry"
                onClick={() => {
                  setAnalysisResult(null);
                  setError(null);
                  setMediaPreview(null);
                  if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                }}
              >
                Try Another
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredFeatures = features.filter((feature) =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="features-section">
      <div className="features-grid">
        {filteredFeatures.map((feature) => (
          <FeatureCard
            key={feature.id}
            {...feature}
            onSelect={() => setSelectedFeature(feature)}
          />
        ))}
      </div>

      {selectedFeature && (
        <UploadModal
          onClose={() => {
            setSelectedFeature(null);
            setAnalysisResult(null);
            setError(null);
          }}
        />
      )}

      <style jsx>{`
        .warning { background-color: #FFF9C4; padding: 15px; border-radius: 4px; }
        .warning-text { color: #F57C00; display: flex; align-items: center; gap: 8px; }
        .fake-text { color: #D32F2F; font-weight: bold; }
        .real-text { color: #388E3C; font-weight: bold; }
        .message-text { font-size: 0.9em; margin-top: 10px; color: #555; }
        .loading-container { margin: 15px 0; text-align: center; }
        .progress-bar { width: 100%; height: 8px; background-color: #e0e0e0; border-radius: 4px; margin: 10px 0; }
        .progress-fill { height: 100%; background-color: #4CAF50; border-radius: 4px; transition: width 0.3s ease; }
        .progress-text { font-size: 12px; color: #757575; margin: 0; }
        .button-group { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
        .Drop-retry { background-color:rgba(244, 37, 37, 0.88); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .Drop-retry:hover { background-color: #1976D2; }
        .dropzone-content { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .dropzone small { color: #757575; }
        .modal-body {padding: 10px;}
        .button-group {display: flex; justify-content: space-between; margin-top: 15px; }
        .upload-preview-container {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }
        .dropzone {
          flex: 1;
          margin-right: 10px;
        }
        .preview {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-body {
          padding: 10px;
        }
      `}</style>
    </section>
  );
};

export default Features;