import axios from 'axios';
import { s3, lambda } from '../config/aws.js';
import { v4 as uuidv4 } from 'uuid';

export class OCRService {
  
  // Upload image ke S3
  async uploadImageToS3(imageBuffer, fileName) {
    const key = `plates/${Date.now()}-${fileName}`;
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };
    
    const result = await s3.upload(params).promise();
    return result.Location;
  }
  
  // Invoke Lambda untuk OCR dengan YOLO11
  async processPlateOCR(imageUrl) {
    try {
      const params = {
        FunctionName: 'onegate-yolo11-ocr',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          imageUrl: imageUrl
        })
      };
      
      const response = await lambda.invoke(params).promise();
      const result = JSON.parse(response.Payload);
      
      return {
        plateNumber: result.plate_number,
        confidence: result.confidence,
        boundingBox: result.bounding_box
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw error;
    }
  }
  
  // Alternatif: Panggil API eksternal jika belum setup Lambda
  async processPlateOCRExternal(imageUrl) {
    // Bisa pakai Google Cloud Vision atau OpenAI Vision
    // Contoh sederhana dengan regex pattern
    return {
      plateNumber: 'B1234XYZ', // Mock result
      confidence: 0.95
    };
  }
}