import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

class MQTTService {
  constructor() {
    this.client = null;
    this.connect();
  }
  
  connect() {
    this.client = mqtt.connect(process.env.MQTT_BROKER, {
      port: process.env.MQTT_PORT,
      clientId: `onegate_server_${Date.now()}`
    });
    
    this.client.on('connect', () => {
      console.log('✅ MQTT Connected');
      this.client.subscribe(process.env.MQTT_TOPIC_CAPTURE);
    });
    
    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error);
    });
  }
  
  // Kirim perintah ke ESP32-CAM
  sendCommand(command, data = {}) {
    const payload = JSON.stringify({
      command,
      data,
      timestamp: Date.now()
    });
    
    this.client.publish(process.env.MQTT_TOPIC_CONTROL, payload);
    console.log(`📤 Sent: ${command}`, data);
  }
  
  // Buka gate
  openGate() {
    this.sendCommand('OPEN_GATE', { duration: 5000 }); // 5 detik
  }
  
  // Tutup gate
  closeGate() {
    this.sendCommand('CLOSE_GATE');
  }
  
  // Request capture image
  requestCapture() {
    this.sendCommand('CAPTURE_IMAGE');
  }
}

export default new MQTTService();