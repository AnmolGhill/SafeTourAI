const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/restricted-areas
 * Get all restricted areas
 */
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('restrictedAreas').get();
    const areas = [];
    
    snapshot.forEach(doc => {
      areas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: areas,
      count: areas.length
    });
  } catch (error) {
    console.error('Error fetching restricted areas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/restricted-areas/active
 * Get only active restricted areas
 */
router.get('/active', async (req, res) => {
  try {
    const snapshot = await db.collection('restrictedAreas')
      .where('active', '==', true)
      .get();
    
    const areas = [];
    snapshot.forEach(doc => {
      areas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: areas,
      count: areas.length
    });
  } catch (error) {
    console.error('Error fetching active restricted areas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/restricted-areas/:id
 * Get a specific restricted area
 */
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('restrictedAreas').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Restricted area not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching restricted area:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/restricted-areas
 * Create a new restricted area (Admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create restricted areas'
      });
    }

    const { name, type, polygon, center, radius, description, riskLevel, active } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }

    // Validate type
    if (!['polygon', 'circle'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "polygon" or "circle"'
      });
    }

    const areaData = {
      name,
      type,
      description: description || '',
      riskLevel: riskLevel || 'medium',
      active: active !== false,
      createdAt: new Date(),
      createdBy: req.user.id
    };

    if (type === 'polygon' && polygon && Array.isArray(polygon)) {
      areaData.polygon = polygon;
    } else if (type === 'circle' && center && radius) {
      areaData.center = center;
      areaData.radius = radius;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid shape data for the specified type'
      });
    }

    const docRef = await db.collection('restrictedAreas').add(areaData);

    res.status(201).json({
      success: true,
      message: 'Restricted area created successfully',
      id: docRef.id,
      data: {
        id: docRef.id,
        ...areaData
      }
    });
  } catch (error) {
    console.error('Error creating restricted area:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/restricted-areas/:id
 * Update a restricted area (Admin only)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can update restricted areas'
      });
    }

    const { name, description, riskLevel, active, polygon, center, radius } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (riskLevel) updateData.riskLevel = riskLevel;
    if (active !== undefined) updateData.active = active;
    if (polygon) updateData.polygon = polygon;
    if (center) updateData.center = center;
    if (radius) updateData.radius = radius;

    updateData.updatedAt = new Date();

    await db.collection('restrictedAreas').doc(req.params.id).update(updateData);

    res.json({
      success: true,
      message: 'Restricted area updated successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error updating restricted area:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/restricted-areas/:id
 * Delete a restricted area (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can delete restricted areas'
      });
    }

    await db.collection('restrictedAreas').doc(req.params.id).delete();

    res.json({
      success: true,
      message: 'Restricted area deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting restricted area:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/restricted-areas/:id/toggle
 * Toggle active status of a restricted area (Admin only)
 */
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can toggle restricted areas'
      });
    }

    const doc = await db.collection('restrictedAreas').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Restricted area not found'
      });
    }

    const newStatus = !doc.data().active;
    await db.collection('restrictedAreas').doc(req.params.id).update({
      active: newStatus,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Restricted area ${newStatus ? 'activated' : 'deactivated'} successfully`,
      id: req.params.id,
      active: newStatus
    });
  } catch (error) {
    console.error('Error toggling restricted area:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
