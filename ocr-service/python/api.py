# Setup for Google Cloud Storage
from google.cloud import storage
import time
import os
from flask import Flask, request, jsonify, send_file
import cv2
import matplotlib.pyplot as plt
import numpy as np
import logging
import pandas as pd
import csv
import ast

# Initialize Flask app
app = Flask(__name__)

# GCS setup
GCS_BUCKET_NAME = 'apnr-output-bucket'  # Replace with your GCS bucket name
storage_client = storage.Client()
bucket = storage_client.get_bucket(GCS_BUCKET_NAME)

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Directories for temporary file storage (optional if you need local temp storage)
UPLOAD_FOLDER = './uploads'
OUTPUT_FOLDER = './output'

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Helper functions to upload/download from GCS
def upload_to_gcs(local_file_path, destination_blob_name):
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(local_file_path)
    logger.info(f"File uploaded to GCS as {destination_blob_name}")
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{destination_blob_name}"

def download_from_gcs(source_blob_name, local_file_path):
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(local_file_path)
    logger.info(f"File downloaded from GCS to {local_file_path}")

# Image processing API
@app.route('/api/process-image', methods=['POST'])
def upload_file_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files['image']
        timestamp = str(int(time.time()))
        file_extension = image_file.filename.split('.')[-1]
        file_name = f"{timestamp}.{file_extension}"

        # Upload the image to GCS
        gcs_image_path = f"uploads/{file_name}"
        image_file.save(os.path.join(UPLOAD_FOLDER, file_name))
        upload_to_gcs(os.path.join(UPLOAD_FOLDER, file_name), gcs_image_path)

        # Process the image
        model_vehicle, model_plate, reader = model()
        local_image_path = os.path.join(UPLOAD_FOLDER, file_name)
        download_from_gcs(gcs_image_path, local_image_path)

        result_img, plate_texts = process_image(model_vehicle, model_plate, reader, local_image_path)
        processed_image_path = os.path.join(OUTPUT_FOLDER, f"processed_{file_name}")
        plt.imsave(processed_image_path, result_img)

        # Upload the processed image to GCS
        gcs_processed_image_path = f"processed/{file_name}"
        upload_to_gcs(processed_image_path, gcs_processed_image_path)

        response = {
            "detected_plates": [plate['text'] for plate in plate_texts],
            "processed_image": gcs_processed_image_path,  # URL of processed image in GCS
            "conf": [plate['conf'].item() for plate in plate_texts],
            "region": [plate['region'] for plate in plate_texts],
        }
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Video processing API
@app.route('/api/process-video', methods=['POST'])
def upload_file_video():
    try:
        results = {}
        valid_license_plates = {}
        mot_tracker = Sort()  # Assuming Sort is defined elsewhere

        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video = request.files['video']
        timestamp = str(int(time.time()))
        file_extension = video.filename.split('.')[-1]
        video_filename = f"{timestamp}.{file_extension}"

        # Upload video to GCS
        gcs_video_path = f"uploads/{video_filename}"
        video.save(os.path.join(UPLOAD_FOLDER, video_filename))
        upload_to_gcs(os.path.join(UPLOAD_FOLDER, video_filename), gcs_video_path)

        # Download video from GCS for processing
        local_video_path = os.path.join(UPLOAD_FOLDER, video_filename)
        download_from_gcs(gcs_video_path, local_video_path)

        # Open video for processing
        cap = cv2.VideoCapture(local_video_path)
        frame_nmr = -1
        ret = True

        while ret:
            frame_nmr += 1
            ret, frame = cap.read()
            if ret:
                results[frame_nmr] = {}

                detections = model_vehicle(frame)[0]
                detections_ = [d[:5] for d in detections.boxes.data.tolist()]
                track_ids = mot_tracker.update(np.array(detections_))

                license_plates = model_plate(frame)[0]
                plates_detections = apply_nms([lp[:5] for lp in license_plates.boxes.data.tolist()])

                for license_plate in plates_detections:
                    # Processing logic for license plates
                    pass

        # Save CSV and interpolated data
        csv_filename = f"{timestamp}.csv"
        csv_path = os.path.join(OUTPUT_FOLDER, 'results', csv_filename)
        write_csv(results, csv_path)

        # Interpolation and video writing logic (as per your original code)
        # ...

        # Upload processed video to GCS
        output_video_filename = f"{timestamp}_output.mp4"
        output_video_path = os.path.join(OUTPUT_FOLDER, output_video_filename)
        gcs_video_output_path = f"processed/{output_video_filename}"
        upload_to_gcs(output_video_path, gcs_video_output_path)

        # Return response with URLs to GCS files
        return jsonify({
            'message': 'Video processed successfully',
            'output_video_path': gcs_video_output_path,
        }), 200
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Serve processed files from output folder (local access)
@app.route('/output/<filename>')
def output_file(filename):
    try:
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        logger.error(f"Error serving file: {str(e)}")
        return jsonify({"error": str(e)}), 404

if __name__ == '__main__':
    app.run(debug=True)


============

from flask import Flask, request, render_template, jsonify, send_file
import cv2
import random
import numpy as np
from pathlib import Path
from ultralytics import YOLO
import re
from difflib import get_close_matches
from matplotlib import pyplot as plt
import time
from flask_cors import CORS
import logging
import traceback
import os
from paddleocr import PaddleOCR
from util.sort import *
import torch
from torchvision.ops import nms
import csv
from scipy.interpolate import interp1d
from scipy.interpolate import interp1d
import ast
import pandas as pd
from google.cloud import storage
import time

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# GCS setup
GCS_BUCKET_NAME = 'apnr-output-bucket'  # Replace with your GCS bucket name
storage_client = storage.Client()
bucket = storage_client.get_bucket(GCS_BUCKET_NAME)

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Directories for temporary file storage (optional if you need local temp storage)
UPLOAD_FOLDER = './uploads'
OUTPUT_FOLDER = './output'

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Helper functions to upload/download from GCS
def upload_to_gcs(local_file_path, destination_blob_name):
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(local_file_path)
    logger.info(f"File uploaded to GCS as {destination_blob_name}")
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{destination_blob_name}"

def download_from_gcs(source_blob_name, local_file_path):
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(local_file_path)
    logger.info(f"File downloaded from GCS to {local_file_path}")


UPLOAD_FOLDER = Path('./uploads')
OUTPUT_FOLDER = Path('./output')
UPLOAD_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)

def region(file_path):
    region_codes = {}
    with open(file_path, 'r') as file:
        for line in file:
            if line.strip():  
                code, region = line.strip().split(': ')
                region_codes[code] = region
    return region_codes

REGION_CODES = region('region.txt')

print(REGION_CODES)

def model():
    model_vehicle = YOLO('model/yolo11n.pt')
    model_plate = YOLO('model/best.pt')
    reader = PaddleOCR(use_angle_cls=True, lang='en')
    return model_vehicle, model_plate, reader

def format_plate_number(text):
    print(f"Formatting plate number: {text}")
    
    text = re.sub(r'[^A-Z0-9]', '', text.upper())
    
    char_substitutions = {
        'O': '0', '0': 'O',
        'I': '1', '1': 'I',
        'Z': '2', '2': 'Z',
        'J': '3', '3': 'J',
        'A': '4', '4': 'A',
        'S': '5', '5': 'S',
        'G': '6', '6': 'G',
        'T': '7', '7': 'T',
        'B': '8', '8': 'B',
    }
    
    def validate_section(text_part, expected_type='alpha'):
        result = ''
        for char in text_part:
            if expected_type == 'alpha' and char.isdigit():
                if char in char_substitutions:
                    result += char_substitutions[char]
                else:
                    result += char
            elif expected_type == 'num' and not char.isdigit():
                if char in char_substitutions:
                    result += char_substitutions[char]
                else:
                    result += char
            else:
                result += char
        return result
    
    number_match = re.search(r'[0-9]{1,4}', text)
    if number_match:
        number_start = number_match.start()
        number_end = number_match.end()
        
        prefix = text[:number_start]
        numbers = text[number_start:number_end]
        suffix = text[number_end:]
        
        prefix = validate_section(prefix, 'alpha')
        numbers = validate_section(numbers, 'num')
        suffix = validate_section(suffix, 'alpha')
        
        if len(prefix) <= 2 and len(numbers) <= 4 and len(suffix) <= 3:
            region_check = get_closest_region_code(prefix)
            if region_check:
                formatted_plate = f"{region_check} {numbers} {suffix}"
                print(f"Formatted plate number: {formatted_plate}")
                return formatted_plate
    
    parts = re.findall(r'[A-Z]+|[0-9]+', text)
    if len(parts) >= 3:
        prefix = validate_section(parts[0], 'alpha')
        numbers = validate_section(parts[1], 'num')
        suffix = validate_section(''.join(parts[2:]), 'alpha')
        
        if len(prefix) <= 2 and len(numbers) <= 4 and len(suffix) <= 3:
            region_check = get_closest_region_code(prefix)
            if region_check:
                formatted_plate = f"{region_check} {numbers} {suffix}"
                print(f"Formatted plate number: {formatted_plate}")
                return formatted_plate
    
    print("No valid Indonesian plate format found")
    return None

def get_closest_region_code(code):
    print(f"Getting closest region code for '{code}'")
    if code in REGION_CODES:
        print(f"Exact match found: {code}")
        return code
    matches = get_close_matches(code, REGION_CODES.keys(), n=1, cutoff=0.6)
    closest_match = matches[0] if matches else None
    if closest_match:
        print(f"Closest match found: {closest_match}")
    else:
        print("No close match found.")
    return closest_match

def detect_plates(model_plate, image):
    print("Detecting plates in the image.")
    results = model_plate(image)
    plate_detections = []
    
    for box in results[0].boxes:
        x, y, w, h = box.xywh[0]
        conf = box.conf[0]
        margin = 0.0
        
        x1 = max(0, int(x - w / 2 - margin * w))
        y1 = max(0, int(y - h / 2 - margin * h))
        x2 = min(image.shape[1], int(x + w / 2 + margin * w))
        y2 = min(image.shape[0], int(y + h / 2 + margin * h))
        
        plate_detections.append({
            'bbox': (x1, y1, x2, y2),
            'conf': conf,
            'center': (int(x), int(y)),
            'size': (int(w), int(h))
        })
    
    print(f"Detected {len(plate_detections)} plates.")
    return plate_detections

def enhance_plate_image(plate_img):
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)
    
    denoised = cv2.fastNlMeansDenoising(gray)
    
    binary = cv2.adaptiveThreshold(denoised, 255, 
                                 cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY_INV, 11, 2)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2,2))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    
    return binary

def process_image(model_vehicle, model_plate, reader, image_path):
    print(f"Processing image: {image_path}")
    logger.info("Reading image")
    img = cv2.imread(str(image_path))
    if img is None:
        logger.error("Could not read image")
        raise ValueError(f"Could not read image: {image_path}")
    
    logger.info("Processing image")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    result_img = img_rgb.copy()

    logger.info("Detecting vehicles")
    vehicles = model_vehicle(img)
    for box in vehicles[0].boxes:
        x, y, w, h = box.xywh[0]
        conf = box.conf[0]
        x1 = max(0, int(x - w / 2))
        y1 = max(0, int(y - h / 2))
        x2 = min(img.shape[1], int(x + w / 2))
        y2 = min(img.shape[0], int(y + h / 2))

        cv2.rectangle(result_img, (x1, y1), (x2, y2), (0, 0, 255), 2)
        label = f"Vehicle {conf:.2f}"
        cv2.putText(result_img, label, (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    logger.info("Detecting plates")
    plates = detect_plates(model_plate, img)
    plate_texts = []

    for plate in plates:
        x1, y1, x2, y2 = plate['bbox']
        
        if x2 > x1 and y2 > y1:
            plate_crop = img[y1:y2, x1:x2]
            if plate_crop.size > 0:
                plate_text = read_plate(reader, plate_crop)
                
                if plate_text == "Tidak Terbaca":
                    region_name = "Unknown"
                else:
                    region_code = plate_text.split()[0]
                    region_name = REGION_CODES.get(region_code, "Unknown")

                plate_texts.append({
                    'text': plate_text,
                    'conf': plate['conf'],
                    'region': region_name
                })

                cv2.rectangle(result_img, (x1, y1), (x2, y2), (0, 255, 0), 2)

                label = f"{plate_text} - {region_name}" if plate_text != "Tidak Terbaca" else "Tidak Terbaca"
                cv2.putText(result_img, label, (x1, max(y1 - 10, 20)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    return result_img, plate_texts

def read_plate(reader, plate_img):
    print("Reading plate text using OCR.")

    rows, cols = plate_img.shape[:2]
    if rows > cols:
        plate_img = cv2.rotate(plate_img, cv2.ROTATE_90_CLOCKWISE)
    
    attempts = [
        plate_img,  
        enhance_plate_image(plate_img),  
        cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY),  
        cv2.threshold(cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY), 
                      0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],  
    ]
    
    all_texts = []
    
    for img in attempts:
        img_data = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) if len(img.shape) == 3 else img
        results = reader.ocr(img_data, cls=True)
        
        if results and results[0]:
            sorted_results = sorted(results[0], key=lambda x: x[0][0][1])
            combined_text = ''
            for result in sorted_results:
                text = result[1][0]
                if len(text) > len(combined_text):
                    combined_text += text
            
            all_texts.append(combined_text)
    
    for text in all_texts:
        formatted = format_plate_number(text)
        if formatted:
            print(f"Successfully detected plate: {formatted}")
            return formatted
    
    print("No valid plate text detected")
    return "Tidak Terbaca"

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png','gif','bmp','avi','mkv','webm','mov','flv','wmv','mpg','mpeg','mp4','m4v','3gp','3g2'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def process_uploaded_image(image_file):
    output_dir = Path('./output')
    output_dir.mkdir(exist_ok=True)
    
    img_path = UPLOAD_FOLDER / image_file.filename
    image_file.save(img_path)
    
    print(f"Processing image: {img_path.name}")

    model_vehicle, model_plate, reader = model()
    try:
        result_img, plate_texts = process_image(model_vehicle, model_plate, reader, img_path)
    except Exception as e:
        print(f"Error processing image {img_path.name}: {e}")
        return f"Error processing image {img_path.name}: {e}", 500

    save_path = output_dir / f"processed_{img_path.name}"
    plt.imsave(str(save_path), result_img)

    plt.figure(figsize=(12, 8))
    plt.imshow(result_img)
    plt.axis('off')
    plt.title(f"Processed: {img_path.name}")
    plt.show()
    plt.close()

    output_image_path = output_dir / f"result_{img_path.stem}.png"
    cv2.imwrite(str(output_image_path), cv2.cvtColor(result_img, cv2.COLOR_RGB2BGR))
    print(f"Results saved to: {output_image_path}")

    return plate_texts, output_image_path.name

def apply_nms(detections, conf_threshold=0.5, iou_threshold=0.4):
    if len(detections) == 0:
        return []

    boxes = torch.tensor([d[0:4] for d in detections], dtype=torch.float32)
    scores = torch.tensor([d[4] for d in detections], dtype=torch.float32)

    keep = scores > conf_threshold
    boxes = boxes[keep]
    scores = scores[keep]

    if boxes.ndimension() == 1:
        boxes = boxes.unsqueeze(0)

    if boxes.size(0) == 0:
        return []

    indices = nms(boxes, scores, iou_threshold)

    filtered_detections = [detections[i] for i in indices]
    return filtered_detections

def get_vehicle(license_plate, vehicle_track_ids, score_threshold=0.5):
    x1, y1, x2, y2, score = license_plate
    
    if score < score_threshold:
        return -1, -1, -1, -1, -1
        
    for vehicle in vehicle_track_ids:
        xvehicle1, yvehicle1, xvehicle2, yvehicle2, vehicle_id = vehicle
        if x1 > xvehicle1 and y1 > yvehicle1 and x2 < xvehicle2 and y2 < yvehicle2:
            return vehicle
            
    return -1, -1, -1, -1, -1

def write_csv(results, output_path):
    with open(output_path, 'w') as f:
        f.write('{},{},{},{},{},{},{}\n'.format('frame_nmr', 'vehicle_id', 'vehicle_bbox',
                                                'license_plate_bbox', 'license_plate_bbox_score', 'license_number',
                                                'license_number_score'))
        
        for frame_nmr in results.keys():
            for vehicle_id in results[frame_nmr].keys():
                if all(k in results[frame_nmr][vehicle_id] for k in ['vehicle', 'license_plate']):
                    f.write('{},{},{},{},{},{},{}\n'.format(
                        frame_nmr,
                        vehicle_id,
                        '[{} {} {} {}]'.format(*results[frame_nmr][vehicle_id]['vehicle']['bbox']),
                        '[{} {} {} {}]'.format(*results[frame_nmr][vehicle_id]['license_plate']['bbox']),
                        results[frame_nmr][vehicle_id]['license_plate']['bbox_score'],
                        results[frame_nmr][vehicle_id]['license_plate']['text'],
                        results[frame_nmr][vehicle_id]['license_plate']['text_score']
                    ))

def get_multiple_plate_readings(reader, plate_img):
    readings = []
    
    result = reader.ocr(plate_img, cls=True)
    if result[0]:
        readings.extend([(line[1][0], line[1][1]) for line in result[0]])
    
    enhanced = enhance_plate_image(plate_img)
    result = reader.ocr(enhanced, cls=True)
    if result[0]:
        readings.extend([(line[1][0], line[1][1]) for line in result[0]])
    
    for angle in [-5, 5]:
        height, width = plate_img.shape[:2]
        matrix = cv2.getRotationMatrix2D((width/2, height/2), angle, 1)
        rotated = cv2.warpAffine(plate_img, matrix, (width, height))
        result = reader.ocr(rotated, cls=True)
        if result[0]:
            readings.extend([(line[1][0], line[1][1]) for line in result[0]])
    
    return readings

def validate_plate_format(text):
    pattern = r'^[A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3}$'
    return bool(re.match(pattern, text))

def clean_value(value):
    cleaned_value = re.sub(r'np\.float64\((.*?)\)', r'\1', value)
    cleaned_value = cleaned_value.replace(',', '').strip()  
    return float(cleaned_value)

def interpolate_bounding_boxes(data):
    frame_numbers = np.array([int(row['frame_nmr']) for row in data])
    vehicle_ids = np.array([int(float(row['vehicle_id'])) for row in data])
    
    vehicle_bboxes = np.array([list(map(float, [clean_value(val) for val in row['vehicle_bbox'][1:-1].split()])) for row in data])
    
    license_plate_bboxes = np.array([list(map(float, [clean_value(val) for val in row['license_plate_bbox'][1:-1].split()])) for row in data])
    license_plate_texts = [row['license_number'] for row in data]
    
    license_number_scores = []
    for row in data:
        try:
            license_number_score = float(row['license_number_score']) if row['license_number_score'] else 0.0  # Default to 0.0 if empty
        except ValueError:
            license_number_score = 0.0  
        license_number_scores.append(license_number_score)
    
    interpolated_data = []
    unique_vehicle_ids = np.unique(vehicle_ids)
    
    for vehicle_id in unique_vehicle_ids:
        frame_numbers_ = [p['frame_nmr'] for p in data if int(float(p['vehicle_id'])) == int(float(vehicle_id))]
        print(f"Processing vehicle ID: {vehicle_id}, Frames: {frame_numbers_}")

        vehicle_mask = vehicle_ids == vehicle_id
        vehicle_frame_numbers = frame_numbers[vehicle_mask]
        vehicle_bboxes_interpolated = []
        license_plate_bboxes_interpolated = []
        license_number_interpolated = []
        license_number_score_interpolated = []  

        first_frame_number = vehicle_frame_numbers[0]
        
        for i in range(len(vehicle_bboxes[vehicle_mask])):
            frame_number = vehicle_frame_numbers[i]
            vehicle_bbox = vehicle_bboxes[vehicle_mask][i]
            license_plate_bbox = license_plate_bboxes[vehicle_mask][i]
            license_number = license_plate_texts[vehicle_mask.nonzero()[0][i]]  
            license_number_score = license_number_scores[vehicle_mask.nonzero()[0][i]]  

            if i > 0:
                prev_frame_number = vehicle_frame_numbers[i-1]
                prev_vehicle_bbox = vehicle_bboxes_interpolated[-1]
                prev_license_plate_bbox = license_plate_bboxes_interpolated[-1]
                prev_license_number = license_number_interpolated[-1]
                prev_license_number_score = license_number_score_interpolated[-1]  

                if frame_number - prev_frame_number > 1:
                    frames_gap = frame_number - prev_frame_number
                    x = np.array([prev_frame_number, frame_number])
                    x_new = np.linspace(prev_frame_number, frame_number, num=frames_gap, endpoint=False)
                    
                    interp_func = interp1d(x, np.vstack((prev_vehicle_bbox, vehicle_bbox)), axis=0, kind='linear')
                    interpolated_vehicle_bboxes = interp_func(x_new)
                    
                    interp_func = interp1d(x, np.vstack((prev_license_plate_bbox, license_plate_bbox)), axis=0, kind='linear')
                    interpolated_license_plate_bboxes = interp_func(x_new)

                    vehicle_bboxes_interpolated.extend(interpolated_vehicle_bboxes[1:])
                    license_plate_bboxes_interpolated.extend(interpolated_license_plate_bboxes[1:])
                    
                    license_number_interpolated.extend([license_number] * (frames_gap - 1))
                    license_number_score_interpolated.extend([license_number_score] * (frames_gap - 1))  

            vehicle_bboxes_interpolated.append(vehicle_bbox)
            license_plate_bboxes_interpolated.append(license_plate_bbox)
            license_number_interpolated.append(license_number)
            license_number_score_interpolated.append(license_number_score)  

        for i in range(len(vehicle_bboxes_interpolated)):
            frame_number = first_frame_number + i
            row = {
                'frame_nmr': str(frame_number),
                'vehicle_id': str(vehicle_id),
                'vehicle_bbox': ' '.join(map(str, vehicle_bboxes_interpolated[i])),
                'license_plate_bbox': ' '.join(map(str, license_plate_bboxes_interpolated[i])),
                'license_number': license_number_interpolated[i],
                'license_plate_bbox_score': '0' if str(frame_number) not in frame_numbers_ else \
                    [p['license_plate_bbox_score'] for p in data if int(p['frame_nmr']) == frame_number and int(float(p['vehicle_id'])) == int(float(vehicle_id))][0],
                'license_number_score': str(license_number_score_interpolated[i])  
            }
            interpolated_data.append(row)

    return interpolated_data

def draw_border(img, top_left, bottom_right, color=(0, 0, 255), thickness=3, line_length_x=200, line_length_y=200):
    x1, y1 = top_left
    x2, y2 = bottom_right

    cv2.line(img, (x1, y1), (x1, y1 + line_length_y), color, thickness)
    cv2.line(img, (x1, y1), (x1 + line_length_x, y1), color, thickness)

    cv2.line(img, (x1, y2), (x1, y2 - line_length_y), color, thickness)
    cv2.line(img, (x1, y2), (x1 + line_length_x, y2), color, thickness)

    cv2.line(img, (x2, y1), (x2 - line_length_x, y1), color, thickness)
    cv2.line(img, (x2, y1), (x2, y1 + line_length_y), color, thickness)

    cv2.line(img, (x2, y2), (x2, y2 - line_length_y), color, thickness)
    cv2.line(img, (x2, y2), (x2 - line_length_x, y2), color, thickness)

    return img

@app.route('/api/process-video', methods=['POST'])
def upload_file_video():
    results = {}
    valid_license_plates = {}
    mot_tracker = Sort()
    
    model_vehicle, model_plate, reader = model()
    
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video = request.files['video']
    
    timestamp = str(int(time.time()))
    file_extension = video.filename.split('.')[-1]
    video_filename = f"{timestamp}.{file_extension}"

    os.makedirs('./uploads', exist_ok=True)
    video_path = os.path.join('./uploads', video_filename)
    video.save(video_path)
    
    # Upload video to GCS
    gcs_video_path = f"uploads/{video_filename}"
    video.save(os.path.join(UPLOAD_FOLDER, video_filename))
    upload_to_gcs(os.path.join(UPLOAD_FOLDER, video_filename), gcs_video_path)
    
    # Download video from GCS for processing
    local_video_path = os.path.join(UPLOAD_FOLDER, video_filename)
    download_from_gcs(gcs_video_path, local_video_path)

    
    print(f"Received file: {video_filename}")

    cap = cv2.VideoCapture(video_path)

    vehicles = [2, 3, 5, 7]

    frame_nmr = -1
    ret = True

    while ret:
        frame_nmr += 1
        ret, frame = cap.read()
        if ret:
            results[frame_nmr] = {}
            
            detections = model_vehicle(frame)[0]
            detections_ = [d[:5] for d in detections.boxes.data.tolist() if int(d[5]) in vehicles]
            
            track_ids = mot_tracker.update(np.array(detections_))
            
            license_plates = model_plate(frame)[0]
            plates_detections = apply_nms([lp[:5] for lp in license_plates.boxes.data.tolist()])
            
            for license_plate in plates_detections:
                x1, y1, x2, y2, score = license_plate
                xvehicle1, yvehicle1, xvehicle2, yvehicle2, vehicle_id = get_vehicle(license_plate, track_ids)
                
                if vehicle_id != -1:
                    license_plate_crop = frame[int(y1):int(y2), int(x1):int(x2)]
                    plate_readings = get_multiple_plate_readings(reader, license_plate_crop)
                    
                    if plate_readings:
                        best_reading = max(plate_readings, key=lambda x: x[1])
                        license_plate_text = best_reading[0]
                        license_plate_text_score = best_reading[1]
                        formatted_plate_text = format_plate_number(license_plate_text)
                    else:
                        license_plate_text = "Tidak Terbaca"
                        license_plate_text_score = 0
                        formatted_plate_text = None
                                
                    if vehicle_id in valid_license_plates:
                        previous_plate, previous_score = valid_license_plates[vehicle_id]
                        if formatted_plate_text and license_plate_text_score > previous_score:
                            valid_license_plates[vehicle_id] = (formatted_plate_text, license_plate_text_score)
                        else:
                            formatted_plate_text = previous_plate
                    elif formatted_plate_text:
                        valid_license_plates[vehicle_id] = (formatted_plate_text, license_plate_text_score)
                    
                    results[frame_nmr][vehicle_id] = {
                        'vehicle': {'bbox': [xvehicle1, yvehicle1, xvehicle2, yvehicle2]},
                        'license_plate': {
                            'bbox': [x1, y1, x2, y2],
                            'bbox_score': score,
                            'text': formatted_plate_text if formatted_plate_text else license_plate_text,
                            'text_score': license_plate_text_score
                        }
                    }

    csv_filename = f"{timestamp}.csv"
    csv_path = os.path.join('./output/results', csv_filename)
    os.makedirs('./output/results', exist_ok=True)
    write_csv(results, csv_path)

    csv_filename = f"{timestamp}.csv"
    csv_path = os.path.join(OUTPUT_FOLDER, 'results', csv_filename)
    write_csv(results, csv_path)
    
    with open(csv_path, 'r') as file:
        reader = csv.DictReader(file)
        data = list(reader)

    interpolated_data = interpolate_bounding_boxes(data)

    interpolated_csv_filename = f"{timestamp}_interpol.csv"
    interpolated_csv_path = os.path.join('./output/results', interpolated_csv_filename)
    
    header = ['frame_nmr', 'vehicle_id', 'vehicle_bbox', 'license_plate_bbox', 'license_plate_bbox_score', 'license_number', 'license_number_score']
    with open(interpolated_csv_path, 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=header)
        writer.writeheader()
        writer.writerows(interpolated_data)

    results_viz = pd.read_csv(interpolated_csv_path)

    output_video_filename = f"{timestamp}_output.mp4"
    output_video_path = os.path.join('./output/', output_video_filename)
    os.makedirs('./output/', exist_ok=True)

    # Upload processed video to GCS
    output_video_filename = f"{timestamp}_output.mp4"
    output_video_path = os.path.join(OUTPUT_FOLDER, output_video_filename)
    gcs_video_output_path = f"processed/{output_video_filename}"
    upload_to_gcs(output_video_path, gcs_video_output_path)


    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    frame_nmr = -1
    ret = True
    
    while ret:
        ret, frame = cap.read()
        frame_nmr += 1
        
        if ret:
            df_ = results_viz[results_viz['frame_nmr'] == frame_nmr]
            
            for row_indx in range(len(df_)):
                vehicle_x1, vehicle_y1, vehicle_x2, vehicle_y2 = ast.literal_eval(
                    df_.iloc[row_indx]['vehicle_bbox'].replace('[ ', '[').replace('   ', ' ').replace('  ', ' ').replace(' ', ',')
                )
                draw_border(
                    frame, 
                    (int(vehicle_x1), int(vehicle_y1)), 
                    (int(vehicle_x2), int(vehicle_y2)), 
                    (255, 0, 0), 
                    25,
                    line_length_x=200, 
                    line_length_y=200
                )

                x1, y1, x2, y2 = ast.literal_eval(
                    df_.iloc[row_indx]['license_plate_bbox'].replace('[ ', '[').replace('   ', ' ').replace('  ', ' ').replace(' ', ',')
                )
                cv2.rectangle(
                    frame, 
                    (int(x1), int(y1)), 
                    (int(x2), int(y2)), 
                    (0, 255, 0), 
                    12
                )
                
                license_number = df_.iloc[row_indx]['license_number']
                text_score = df_.iloc[row_indx]['license_number_score']
                
                if license_number:
                    cv2.putText(
                        frame,
                        f"LP: {license_number}",
                        (int(x1), int(y1) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (255, 255, 255),
                        2
                    )

                if text_score:
                    cv2.putText(
                        frame,
                        f"Score: {text_score}",
                        (int(x1), int(y2) + 30),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (255, 255, 255),
                        2
                    )

            out.write(frame)

    out.release()
    cap.release()
    cv2.destroyAllWindows()

    return jsonify({
        'message': 'Video processed successfully', 
        'csv_path': csv_path,
        'interpolated_csv_path': interpolated_csv_path,
        'output_video_path': output_video_path,
        'processed_video': f"{timestamp}_output.mp4",
        'message': 'Video processed successfully',
        'output_video_path': gcs_video_output_path
    }), 200

    
@app.route('/api/process-image', methods=['POST'])
def upload_file_gambar():
    try:
        logger.info("Received image processing request")
        
        if 'image' not in request.files:
            logger.error("No file part in request")
            return jsonify({"error": "No file uploaded"}), 400

        uploaded_file = request.files['image']
        if uploaded_file.filename == '':
            logger.error("No selected file")
            return jsonify({"error": "No selected file"}), 400
        
        file_extension = os.path.splitext(uploaded_file.filename)[1].lower()
        if file_extension not in ['.jpg', '.jpeg', '.png']:
            logger.error("Invalid file type")
            return jsonify({"error": "Invalid file type"}), 400

        print(f"Received file: {uploaded_file.filename}")
        
        timestamp = str(int(time.time()))
        file_extension = uploaded_file.filename.split('.')[-1]
        file_name = f"{timestamp}.{file_extension}"
        
        UPLOAD_FOLDER.mkdir(exist_ok=True)
        OUTPUT_FOLDER.mkdir(exist_ok=True)
        
        file_path = UPLOAD_FOLDER / file_name
        print(f"Saving file to: {file_path}")
        logger.info(f"Saving uploaded file to {file_path}")
        uploaded_file.save(file_path)
        print(f"File saved successfully")

        print("Loading models...")
        model_vehicle, model_plate, reader = model()
        print("Models loaded successfully")

        print("Processing image...")
        result_img, plate_texts = process_image(model_vehicle, model_plate, reader, file_path)
        print(f"Image processed. Detected plates: {plate_texts}")
        
        save_path = OUTPUT_FOLDER / f"processed_{file_name}"
        print(f"Saving processed image to: {save_path}")
        plt.imsave(str(save_path), result_img)
        print("Processed image saved successfully")

        response = {
            "detected_plates": [plate['text'] for plate in plate_texts],  
            "processed_image": f"processed_{file_name}",
            "conf": [plate['conf'].item() for plate in plate_texts], 
            "region": [plate['region'] for plate in plate_texts],
        }

        print(f"Returning response: {response}")
        return jsonify(response)

    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error occurred: {str(e)}")
        print(f"Traceback: {error_traceback}")
        return jsonify({
            "error": str(e),
            "traceback": error_traceback
        }), 500

@app.route('/output/<filename>')
def output_file(filename):
    try:
        file_path = OUTPUT_FOLDER / filename
        file_extension = filename.split('.')[-1].lower()
        
        logger.info(f"Requested file: {file_path}")
        logger.info(f"File exists: {file_path.exists()}")
        
        mimetypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'csv': 'text/csv'
        }
        # iki mbuh opo...
        mimetype = mimetypes.get(file_extension, 'application/octet-stream')
        
        return send_file(
            file_path,
            mimetype=mimetype,
            as_attachment=False
        )
    except Exception as e:
        logger.error(f"Error serving file: {str(e)}")
        return jsonify({"error": str(e)}), 404

if __name__ == '__main__':
    app.run(debug=True)