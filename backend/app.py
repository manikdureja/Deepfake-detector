from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import tensorflow as tf
import numpy as np
from PIL import Image
from tensorflow.keras.utils import img_to_array
# from tensorflow.keras.preprocessing.image import img_to_array
import cv2

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov'}

for folder in [UPLOAD_FOLDER, PROCESSED_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

try:
    base_dir = os.path.dirname(os.path.abspath(__file__))  
    image_model_path = os.path.join(base_dir, 'model', 'deepfake_detection_MNV2_model_2c.h5')
    video_model_path = os.path.join(base_dir, 'model', 'deepfake_detector_V.h5')
    IMAGE_MODEL = tf.keras.models.load_model(image_model_path)
    VIDEO_MODEL = tf.keras.models.load_model(video_model_path)
    FACE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print("Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {str(e)}")
    IMAGE_MODEL = None
    VIDEO_MODEL = None
    FACE_CASCADE = None
def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def detect_face(image):
    """Detect faces in an image and return the coordinates of the largest face."""
    if isinstance(image, str):  
        img = cv2.imread(image)
    else:  
        img = image
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(gray, 1.1, 5)
    if len(faces) == 0:
        return None
    
    largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
    return largest_face

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    face_rect = detect_face(img)
    
    if face_rect is None:
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (96, 96))
    else:
        x, y, w, h = face_rect
        margin = int(w * 0.2)
        x_with_margin = max(0, x - margin)
        y_with_margin = max(0, y - margin)
        w_with_margin = min(img.shape[1] - x_with_margin, w + 2 * margin)
        h_with_margin = min(img.shape[0] - y_with_margin, h + 2 * margin)
        
        # Extract face with margin
        face_img = img[y_with_margin:y_with_margin + h_with_margin, 
                       x_with_margin:x_with_margin + w_with_margin]
        
        # Convert to RGB and resize
        face_img_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(face_img_rgb, (96, 96))
    
    # Convert to numpy array and normalize
    img_array = img_to_array(img_resized) / 255.0
    return np.expand_dims(img_array, axis=0)

def analyze_image_with_model(image_path):
    try:
        # Check if face is detected
        img = cv2.imread(image_path)
        face_rect = detect_face(img)
        
        if face_rect is None:
            return {'is_deepfake': -1, 'confidence': 0, 'message': 'No face detected in the image'}
        
        # Preprocess the image with the detected face
        img_array = preprocess_image(image_path)
        
        # Make prediction
        prediction = IMAGE_MODEL.predict(img_array)
        confidence = float(prediction[0][0])
        is_deepfake = int(confidence > 0.5)
        
        return {'is_deepfake': is_deepfake, 'confidence': confidence, 'message': 'Face analyzed successfully'}
    
    except Exception as e:
        raise Exception(f"Failed to analyze the image: {str(e)}")

def preprocess_video_frame(frame):
    face_rect = detect_face(frame)
    if face_rect is None:
        return None
    x, y, w, h = face_rect
    margin = int(w * 0.2)
    x_with_margin = max(0, x - margin)
    y_with_margin = max(0, y - margin)
    w_with_margin = min(frame.shape[1] - x_with_margin, w + 2 * margin)
    h_with_margin = min(frame.shape[0] - y_with_margin, h + 2 * margin)
    face_img = frame[y_with_margin:y_with_margin + h_with_margin, 
                    x_with_margin:x_with_margin + w_with_margin]
    face_img_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(face_img_rgb, (224, 224))  
    img_array = img_to_array(img_resized) / 255.0
    return np.expand_dims(img_array, axis=0)

def analyze_video_frame(frame):
    processed_frame = preprocess_video_frame(frame)
    if processed_frame is None:
        return None
    prediction = VIDEO_MODEL.predict(processed_frame)
    return float(prediction[0][0])

def process_video(video_path):
    cap = cv2.VideoCapture(video_path)
    deepfake_scores = []
    frame_count = 0
    processed_frames = 0
    sample_rate = 5  
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % sample_rate == 0:
            score = analyze_video_frame(frame)
            if score is not None:  
                deepfake_scores.append(score)
                processed_frames += 1
                
        frame_count += 1
    
    cap.release()
    
    if processed_frames == 0:
        return {'is_deepfake': -1, 'confidence': 0, 'message': 'No faces found in the video'}
    
    confidence = sum(deepfake_scores) / processed_frames
    is_deepfake = int(confidence > 0.5)
    return {
        'is_deepfake': is_deepfake, 
        'confidence': confidence, 
        'message': f'Analyzed {processed_frames} frames with faces out of {frame_count} total frames'
    }

@app.route('/api/analyze/image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'error': 'Invalid file type. Please upload a JPG or PNG image.'}), 400
    
    if IMAGE_MODEL is None or FACE_CASCADE is None:
        return jsonify({'error': 'Required models not loaded'}), 500
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    try:
        result = analyze_image_with_model(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up the uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/analyze/video', methods=['POST'])
def analyze_video():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename, ALLOWED_VIDEO_EXTENSIONS):
        return jsonify({'error': 'Invalid file type. Please upload an MP4, AVI, or MOV video.'}), 400
    
    if VIDEO_MODEL is None or FACE_CASCADE is None:
        return jsonify({'error': 'Required models not loaded'}), 500
    
    filename = secure_filename(file.filename)
    video_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(video_path)
    
    try:
        result = process_video(video_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
