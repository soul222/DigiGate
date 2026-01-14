import { supabase } from '../config/supabase.js';
import mqttService from '../services/mqttService.js';

export class GateController {
  
  // Manual open gate
  async openGate(req, res) {
    try {
      const { triggered_by, reason } = req.body;
      
      // Log manual control
      await supabase
        .from('gate_controls')
        .insert([{
          action: 'open',
          triggered_by,
          reason
        }]);
      
      // Send command to ESP32
      mqttService.openGate();
      
      res.json({
        success: true,
        message: 'Gate opened successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Manual close gate
  async closeGate(req, res) {
    try {
      const { triggered_by, reason } = req.body;
      
      await supabase
        .from('gate_controls')
        .insert([{
          action: 'close',
          triggered_by,
          reason
        }]);
      
      mqttService.closeGate();
      
      res.json({
        success: true,
        message: 'Gate closed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Get gate status (dari ESP32)
  async getGateStatus(req, res) {
    try {
      // Implement status check via MQTT or HTTP
      res.json({
        success: true,
        status: 'closed', // Mock
        lastAction: new Date()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}