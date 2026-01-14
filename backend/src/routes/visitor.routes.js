import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Get all visitors
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('visitor_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Update status based on expiry
    const now = new Date()
    const updatedData = data.map(visitor => {
      const validUntil = new Date(visitor.valid_until)
      let status = visitor.status
      
      if (validUntil < now && status !== 'expired') {
        status = 'expired'
      } else if (validUntil > now && status === 'pending') {
        status = 'active'
      }
      
      return { ...visitor, status }
    })

    res.json({
      success: true,
      data: updatedData
    })
  } catch (error) {
    console.error('Error fetching visitors:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Create new visitor invitation
router.post('/', async (req, res) => {
  try {
    const { visitor_name, phone, host_unit, plate_number, valid_until } = req.body

    // Validate required fields
    if (!visitor_name || !phone || !host_unit || !valid_until) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    // Generate unique QR code
    const qrCode = uuidv4()

    // Insert into database
    const { data, error } = await supabase
      .from('visitor_invitations')
      .insert([{
        visitor_name,
        phone,
        host_unit,
        plate_number: plate_number || null,
        qr_code: qrCode,
        valid_until,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Visitor invitation created successfully'
    })
  } catch (error) {
    console.error('Error creating visitor:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Verify QR Code
router.post('/verify-qr', async (req, res) => {
  try {
    const { qr_code } = req.body

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required'
      })
    }

    // Find visitor by QR code
    const { data: visitor, error } = await supabase
      .from('visitor_invitations')
      .select('*')
      .eq('qr_code', qr_code)
      .single()

    if (error || !visitor) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR code'
      })
    }

    // Check if expired
    const now = new Date()
    const validUntil = new Date(visitor.valid_until)
    
    if (validUntil < now) {
      return res.json({
        success: false,
        error: 'QR code has expired',
        data: visitor
      })
    }

    // Check status
    if (visitor.status === 'used') {
      return res.json({
        success: false,
        error: 'QR code has already been used',
        data: visitor
      })
    }

    // Valid QR code
    res.json({
      success: true,
      data: visitor,
      message: 'Valid QR code'
    })
  } catch (error) {
    console.error('Error verifying QR:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Update visitor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { visitor_name, phone, host_unit, plate_number, valid_until, status } = req.body

    const updateData = {}
    if (visitor_name) updateData.visitor_name = visitor_name
    if (phone) updateData.phone = phone
    if (host_unit) updateData.host_unit = host_unit
    if (plate_number !== undefined) updateData.plate_number = plate_number
    if (valid_until) updateData.valid_until = valid_until
    if (status) updateData.status = status
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('visitor_invitations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Visitor updated successfully'
    })
  } catch (error) {
    console.error('Error updating visitor:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Delete visitor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('visitor_invitations')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Visitor deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting visitor:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Verify QR code
router.post('/verify-qr', async (req, res) => {
  try {
    const { qr_code } = req.body

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required'
      })
    }

    // Find visitor by QR code
    const { data, error } = await supabase
      .from('visitor_invitations')
      .select('*')
      .eq('qr_code', qr_code)
      .single()

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR code'
      })
    }

    // Check if expired
    const now = new Date()
    const validUntil = new Date(data.valid_until)

    if (validUntil < now) {
      // Update status to expired
      await supabase
        .from('visitor_invitations')
        .update({ status: 'expired' })
        .eq('id', data.id)

      return res.status(403).json({
        success: false,
        error: 'QR code has expired',
        data: { ...data, status: 'expired' }
      })
    }

    // Update status to active if pending
    if (data.status === 'pending') {
      await supabase
        .from('visitor_invitations')
        .update({ status: 'active' })
        .eq('id', data.id)
    }

    res.json({
      success: true,
      data: {
        ...data,
        status: data.status === 'pending' ? 'active' : data.status
      },
      message: 'QR code verified successfully'
    })
  } catch (error) {
    console.error('Error verifying QR code:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
