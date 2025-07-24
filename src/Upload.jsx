// src/components/UploadSection.jsx
const UploadSection = ({ type, acceptedTypes, onClose }) => {
    const handleUpload = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(`/api/${type}/analyze`, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        // Handle result
      } catch (error) {
        console.error('Upload failed:', error);
      }
    };
  
    return (
      <div className="upload-overlay">
        <div className="upload-container">
          <button className="close-button" onClick={onClose}>×</button>
          <h3>Upload {type}</h3>
          <div className="dropzone">
            <input 
              type="file"
              accept={acceptedTypes}
              onChange={(e) => handleUpload(e.target.files[0])}
            />
            <p>Drag and drop or click to upload</p>
          </div>
        </div>
      </div>
    );
  };

  export default UploadSection;