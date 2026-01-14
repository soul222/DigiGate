import axios from "axios";
import FormData from "form-data";
import { config } from "../config.js";

export async function inferPlate({ imageBuffer }) {
  const form = new FormData();
  form.append("image", imageBuffer, { filename: "capture.jpg" });

  // Use the correct endpoint from Python OCR service
  const url = `${config.ocrUrl}/api/verify-plate`;
  
  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    timeout: 15000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  // Python service returns: { plate_number, confidence, region }
  return {
    plate_text: res.data.plate_number,
    confidence: res.data.confidence,
    region: res.data.region,
    bbox: null // Not provided by simplified endpoint
  };
}
