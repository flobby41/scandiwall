const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  first_name: { 
    type: String, 
    required: true 
  },
  last_name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String 
  },
  address: { 
    type: String 
  },
  role: { 
    type: String, 
    default: 'customer', 
    enum: ['customer', 'admin'] 
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

module.exports = mongoose.model('User', userSchema); 