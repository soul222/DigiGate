import express from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Register new user (SIMPLIFIED - NO BCRYPT FOR NOW)
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role, unit_number, phone, plate_number } = req.body

    // Validate required fields
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: full_name, email, password, role'
      })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      })
    }

    // Insert new user (PLAIN PASSWORD - TEMPORARY)
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        full_name,
        email,
        password, // PLAIN PASSWORD - WILL ADD BCRYPT LATER
        role,
        unit_number: unit_number || null,
        phone: phone || null,
        plate_number: plate_number || null
      }])
      .select('id, full_name, email, role, unit_number, phone, plate_number')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // If role is resident and has plate_number, auto-create in vehicles table
    if (role === 'resident' && plate_number) {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert([{
          plate_number: plate_number.toUpperCase(),
          owner_name: full_name,
          phone,
          unit_number,
          status: 'active'
        }])

      if (vehicleError) {
        console.error('Error creating vehicle entry:', vehicleError)
        // Don't fail the registration if vehicle creation fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser
    })
  } catch (error) {
    console.error('Error registering user:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
})

// Login user (SIMPLIFIED - NO BCRYPT FOR NOW)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
    }

    // Verify password (PLAIN COMPARISON - TEMPORARY)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
})

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, unit_number, phone')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }
})

export default router
