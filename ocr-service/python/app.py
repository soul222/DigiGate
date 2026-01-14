from flask import Flask, request, jsonify, send_file
import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
import re
from difflib import get_close_matches
from matplotlib import pyplot as plt
import time
from flask_cors import CORS
import logging
import os
from paddleocr import PaddleOCR
# from pyzbar.pyzbar import decode  # Commented out - not needed for plate detection
import json

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = Path('./uploads')
OUTPUT_FOLDER = Path('./output')
UPLOAD_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)

# Load region codes
def region(file_path):
    region_codes = {}
    with open(file_path, 'r') as file:
        for line in file:
            if line.strip():  
                code, region = line.strip().split(': ')
                region_codes[code] = region
    return region_codes

REGION_CODES = region('region.txt')

def model():
    model_vehicle = YOLO('../model/yolo11n.pt')
    model_plate = YOLO('../model/best.pt')
    reader = PaddleOCR(use_angle_cls=True, lang='en')
    return model_vehicle, model_plate, reader

def format_plate_number(text):
    logger.info(f"Formatting plate number: {text}")
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
                logger.info(f"Formatted plate number: {formatted_plate}")
                return formatted_plate
    
    logger.info("No valid Indonesian plate format found")
    return None

def get_closest_region_code(code):
    if code in REGION_CODES:
        return code
    matches = get_close_matches(code, REGION_CODES.keys(), n=1, cutoff=0.6)
    return matches[0] if matches else None

def detect_plates(model_plate, image):
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

def read_plate(reader, plate_img):
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
            return formatted
    
    return "Tidak Terbaca"

def process_image(model_vehicle, model_plate, reader, image_path):
    logger.info("Reading image")
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    result_img = img_rgb.copy()

    # Detect vehicles
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

    # Detect plates
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

# API Endpoints
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'service': 'OCR Service',
        'version': '1.0.0',
        'timestamp': time.time()
    })

@app.route('/api/process-image', methods=['POST'])
def upload_file_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files['image']
        timestamp = str(int(time.time()))
        file_extension = image_file.filename.split('.')[-1]
        file_name = f"{timestamp}.{file_extension}"
        file_path = UPLOAD_FOLDER / file_name
        
        image_file.save(file_path)

        model_vehicle, model_plate, reader = model()
        result_img, plate_texts = process_image(model_vehicle, model_plate, reader, file_path)
        
        save_path = OUTPUT_FOLDER / f"processed_{file_name}"
        plt.imsave(str(save_path), result_img)

        response = {
            "detected_plates": [plate['text'] for plate in plate_texts],
            "processed_image": f"processed_{file_name}",
            "conf": [plate['conf'].item() for plate in plate_texts],
            "region": [plate['region'] for plate in plate_texts],
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

# QR Scanning endpoint disabled - pyzbar not available on Windows
# @app.route('/api/scan-qr', methods=['POST'])
# def scan_qr_code():
#     try:
#         if 'image' not in request.files:
#             return jsonify({"error": "No image uploaded"}), 400
#         # ... rest of QR scanning code ...
#     except Exception as e:
#         logger.error(f"Error scanning QR code: {str(e)}")
#         return jsonify({"error": str(e)}), 500

@app.route('/output/<filename>')
def output_file(filename):
    try:
        file_path = OUTPUT_FOLDER / filename
        return send_file(file_path, as_attachment=False)
    except Exception as e:
        logger.error(f"Error serving file: {str(e)}")
        return jsonify({"error": str(e)}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)