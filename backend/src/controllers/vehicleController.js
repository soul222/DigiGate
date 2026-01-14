import { supabase } from '../config/supabase.js';

export class VehicleController {
  
  // Get all vehicles (actually residents)
  async getAllVehicles(req, res) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, unit_number, plate_number, status, created_at')
        .eq('role', 'resident')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform to match vehicle structure for frontend compatibility
      const vehicles = data.map(user => ({
        id: user.id,
        plate_number: user.plate_number || '',
        owner_name: user.full_name,
        phone: user.phone,
        unit_number: user.unit_number,
        status: user.status,
        created_at: user.created_at
      }));
      
      res.json({
        success: true,
        data: vehicles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Add new vehicle (create resident account)
  async addVehicle(req, res) {
    try {
      const { plate_number, owner_name, phone, unit_number, email, password } = req.body;
      
      // Validate required fields
      if (!plate_number || !owner_name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: plate_number, owner_name, email, password'
        });
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Create user account
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{
          full_name: owner_name,
          email,
          password, // Plain password (should use bcrypt in production)
          role: 'resident',
          phone,
          unit_number,
          plate_number: plate_number.toUpperCase()
        }])
        .select()
        .single();
      
      if (userError) throw userError;

      // Auto-create in vehicles table for backward compatibility
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert([{
          plate_number: plate_number.toUpperCase(),
          owner_name,
          phone,
          unit_number,
          status: 'active'
        }]);

      if (vehicleError) {
        console.error('Error syncing to vehicles table:', vehicleError);
        // Don't fail if vehicle sync fails
      }
      
      res.json({
        success: true,
        message: 'Resident account created successfully',
        data: {
          id: user.id,
          plate_number: user.plate_number,
          owner_name: user.full_name,
          phone: user.phone,
          unit_number: user.unit_number,
          status: user.status,
          created_at: user.created_at
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update vehicle (update resident)
  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const { owner_name, phone, unit_number, plate_number, status } = req.body;

      // Update user
      const updateData = {};
      if (owner_name) updateData.full_name = owner_name;
      if (phone) updateData.phone = phone;
      if (unit_number) updateData.unit_number = unit_number;
      if (plate_number) updateData.plate_number = plate_number.toUpperCase();

      const { data: user, error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (userError) throw userError;

      // Sync to vehicles table
      if (user.plate_number) {
        const vehicleData = {};
        if (owner_name) vehicleData.owner_name = owner_name;
        if (phone) vehicleData.phone = phone;
        if (unit_number) vehicleData.unit_number = unit_number;
        if (status) vehicleData.status = status;

        await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('plate_number', user.plate_number);
      }

      res.json({
        success: true,
        message: 'Resident updated successfully',
        data: {
          id: user.id,
          plate_number: user.plate_number,
          owner_name: user.full_name,
          phone: user.phone,
          unit_number: user.unit_number,
          status: 'active' // Default for frontend
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Check if vehicle is authorized
  async checkVehicle(req, res) {
    try {
      const { plate_number } = req.params;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('plate_number', plate_number.toUpperCase())
        .eq('role', 'resident')
        .single();
      
      if (error || !data) {
        return res.json({
          success: false,
          authorized: false,
          message: 'Vehicle not authorized'
        });
      }
      
      res.json({
        success: true,
        authorized: true,
        data: {
          owner_name: data.full_name,
          unit_number: data.unit_number,
          phone: data.phone
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // Delete vehicle (soft delete resident)
  async deleteVehicle(req, res) {
    try {
      const { id } = req.params;
      
      // Get user data first
      const { data: user } = await supabase
        .from('users')
        .select('plate_number')
        .eq('id', id)
        .single();

      // Delete user (hard delete since no status column)
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (userError) throw userError;

      // Sync to vehicles table
      if (user && user.plate_number) {
        await supabase
          .from('vehicles')
          .update({ status: 'inactive' })
          .eq('plate_number', user.plate_number);
      }
      
      res.json({
        success: true,
        message: 'Resident deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
