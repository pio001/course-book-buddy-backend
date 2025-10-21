const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Department = require('../models/Department');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }
    
    res.json(department);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Department not found' });
    }
    res.status(500).send('Server error');
  }
});

// Create a department (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { name, code, faculty } = req.body;
    
    // Check if department already exists
    let department = await Department.findOne({ $or: [{ name }, { code }] });
    if (department) {
      return res.status(400).json({ msg: 'Department already exists' });
    }
    
    // Create new department
    department = new Department({
      name,
      code,
      faculty
    });
    
    await department.save();
    
    res.json(department);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a department (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { name, code, faculty } = req.body;
    
    // Build department object
    const departmentFields = {};
    if (name) departmentFields.name = name;
    if (code) departmentFields.code = code;
    if (faculty) departmentFields.faculty = faculty;
    
    let department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }
    
    department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: departmentFields },
      { new: true }
    );
    
    res.json(department);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Department not found' });
    }
    res.status(500).send('Server error');
  }
});

// Delete a department (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }
    
    await department.remove();
    
    res.json({ msg: 'Department removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Department not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;