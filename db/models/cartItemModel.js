const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  }
});

// Index composé pour garantir qu'un utilisateur ne peut pas avoir le même produit deux fois dans son panier
cartItemSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema); 