import express from 'express'
import axios from 'axios'
import FormData from 'form-data'
import multer from 'multer'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// OCR Service URL from environment variable
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5000'

// Scan license plate from image
router.post('/scan-plate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    // Create form data to send to Python OCR service
    const formData = new FormData()
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    // Forward request to Python OCR service
    const response = await axios.post(
      `${OCR_SERVICE_URL}/api/process-image`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000 // 30 seconds timeout
      }
    )

    const { detected_plates, conf, region } = response.data

    // Check if plate was detected
    if (!detected_plates || detected_plates.length === 0) {
      return res.json({
        success: false,
        error: 'No license plate detected in image',
        ocr_result: response.data
      })
    }

    // Get first detected plate
    const plateNumber = detected_plates[0]
    const confidence = conf[0]
    const plateRegion = region[0]

    // Verify against database
    const { supabase } = await import('../config/supabase.js')
    const cleanPlate = plateNumber.replace(/\s+/g, '')
    
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, email, phone, unit_number, plate_number')
      .eq('role', 'resident')
      .ilike('plate_number', `%${cleanPlate}%`)
      .single()

    res.json({
      success: true,
      plate_number: plateNumber,
      confidence: confidence,
      region: plateRegion,
      verified: !!user,
      resident: user ? {
        id: user.id,
        name: user.full_name,
        unit: user.unit_number,
        phone: user.phone,
        plate_number: user.plate_number
      } : null,
      ocr_result: response.data
    })
  } catch (error) {
    console.error('Error scanning license plate:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'OCR service is not available. Please ensure the Python service is running.'
      })
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message
    })
  }
})

// Scan QR code from image
router.post('/scan-qr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    // Create form data to send to Python OCR service
    const formData = new FormData()
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    // Forward request to Python OCR service for QR scanning
    const response = await axios.post(
      `${OCR_SERVICE_URL}/api/scan-qr`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 15000 // 15 seconds timeout
      }
    )

    res.json({
      success: true,
      data: response.data
    })
  } catch (error) {
    console.error('Error scanning QR code:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'OCR service is not available. Please ensure the Python service is running.'
      })
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message
    })
  }
})

// Health check for OCR service
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${OCR_SERVICE_URL}/health`, {
      timeout: 5000
    })

    res.json({
      success: true,
      ocr_service: 'online',
      data: response.data
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      ocr_service: 'offline',
      error: 'OCR service is not responding'
    })
  }
})

export default router
