import { supabase } from '../config/supabase.js';
import axios from 'axios';
import FormData from 'form-data';

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5000';

export class OCRController {
  
  // Scan license plate from image
  async scanPlate(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file uploaded'
        });
      }

      // Forward image to Python OCR service
      const formData = new FormData();
      formData.append('image', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const ocrResponse = await axios.post(
        `${OCR_SERVICE_URL}/api/process-image`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000 // 30 second timeout
        }
      );

      const { detected_plates, conf, region } = ocrResponse.data;

      if (!detected_plates || detected_plates.length === 0) {
        return res.json({
          success: false,
          error: 'No license plate detected in image',
          ocr_result: ocrResponse.data
        });
      }

      // Get the first detected plate (highest confidence)
      const plateNumber = detected_plates[0];
      const confidence = conf[0];
      const plateRegion = region[0];

      // Verify plate against database
      const verification = await this.verifyPlate(plateNumber);

      res.json({
        success: true,
        plate_number: plateNumber,
        confidence: confidence,
        region: plateRegion,
        verified: verification.found,
        resident: verification.resident,
        ocr_result: ocrResponse.data
      });

    } catch (error) {
      console.error('Error scanning plate:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: 'OCR service is not available. Please ensure Python service is running on port 5000.'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Verify plate number against database
  async verifyPlate(plateNumber) {
    try {
      // Clean plate number (remove spaces)
      const cleanPlate = plateNumber.replace(/\s+/g, '');

      // Search in users table
      const { data: user, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, unit_number, plate_number')
        .eq('role', 'resident')
        .ilike('plate_number', `%${cleanPlate}%`)
        .single();

      if (error || !user) {
        return {
          found: false,
          resident: null
        };
      }

      return {
        found: true,
        resident: {
          id: user.id,
          name: user.full_name,
          unit: user.unit_number,
          phone: user.phone,
          plate_number: user.plate_number
        }
      };

    } catch (error) {
      console.error('Error verifying plate:', error);
      return {
        found: false,
        resident: null
      };
    }
  }

  // Health check for OCR service
  async checkOCRService(req, res) {
    try {
      const response = await axios.get(`${OCR_SERVICE_URL}/health`, {
        timeout: 5000
      });

      res.json({
        success: true,
        ocr_service: response.data
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'OCR service is not available',
        details: error.message
      });
    }
  }
}
