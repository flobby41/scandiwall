const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true 
  },
  stock_quantity: { 
    type: Number, 
    required: true 
  },
  image: { 
    type: String 
  },
  category: { 
    type: String 
  },
  slugs: { 
    type: String 
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

module.exports = mongoose.model('Product', productSchema); 