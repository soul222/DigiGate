import { supabase } from '../config/supabase.js';
import { OCRService } from '../services/ocrService.js';
import mqttService from '../services/mqttService.js';

const ocrService = new OCRService();

export class AccessController {
  
  // Process incoming vehicle
  async processAccess(req, res) {
    try {
      const imageBuffer = req.file.buffer;
      
      // 1. Upload image ke S3
      const imageUrl = await ocrService.uploadImageToS3(
        imageBuffer, 
        req.file.originalname
      );
      
      // 2. Process OCR
      const ocrResult = await ocrService.processPlateOCR(imageUrl);
      
      // 3. Check authorization
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('plate_number', ocrResult.plateNumber)
        .eq('status', 'active')
        .single();
      
      const isAuthorized = !!vehicle;
      
      // 4. Log access
      const { data: log } = await supabase
        .from('access_logs')
        .insert([{
          plate_number: ocrResult.plateNumber,
          image_url: imageUrl,
          ocr_result: JSON.stringify(ocrResult),
          gate_status: isAuthorized ? 'opened' : 'rejected',
          confidence: ocrResult.confidence
        }])
        .select()
        .single();
      
      // 5. Control gate
      if (isAuthorized && ocrResult.confidence > 0.8) {
        mqttService.openGate();
      }
      
      res.json({
        success: true,
        authorized: isAuthorized,
        plateNumber: ocrResult.plateNumber,
        confidence: ocrResult.confidence,
        vehicle,
        logId: log.id
      });
      
    } catch (error) {
      console.error('Access process error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get access logs
  async getAccessLogs(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const { data, error, count } = await supabase
        .from('access_logs')
        .select('*, vehicles(*)', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      res.json({
        success: true,
        data,
        total: count,
        page: Math.floor(offset / limit) + 1
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get statistics
  async getStatistics(req, res) {
    try {
      // Total vehicles
      const { count: totalVehicles } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      // Today's entries
      const today = new Date().toISOString().split('T')[0];
      const { count: todayEntries } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', `${today}T00:00:00`)
        .eq('gate_status', 'opened');
      
      // Rejected today
      const { count: todayRejected } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', `${today}T00:00:00`)
        .eq('gate_status', 'rejected');
      
      res.json({
        success: true,
        statistics: {
          totalVehicles,
          todayEntries,
          todayRejected
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}