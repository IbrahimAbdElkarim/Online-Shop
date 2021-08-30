const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({

  email: {
    type: String,
    required: true
  },  
  password: {
    type: String,
    required: true
  },
  resetToken:{
    type: String
  },
  resetTokenExpiration:{
    type: Date},
  cart: {
    items: [{
      prodId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref:'Product'
      },
      quantity: {
        type: Number,
        required: true
      }
    }]
  }
});


userSchema.methods.addToCart=function(product){
const cartProductIndex=this.cart.items.findIndex(cp=>{
return cp.prodId.toString()===product._id.toString();
});
let newQuantity=1;
const updatedCartItems=[...this.cart.items];
if(cartProductIndex>=0){
  newQuantity=this.cart.items[cartProductIndex].quantity+1;
  updatedCartItems[cartProductIndex].quantity=newQuantity;
}else{
  updatedCartItems.push({
    prodId:product._id,
    quantity:newQuantity});
}
const updatedCart={items:updatedCartItems};
this.cart=updatedCart;
return this.save();
};

userSchema.methods.removeFromCart = function(prodId) {
  const updatedCartItems = this.cart.items.filter(item => {
    console.log('item',item);
    console.log('product._id',prodId);

    return item.prodId.toString() !== prodId.toString();
  });
  this.cart.items=updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart=function(){
  this.cart={items:[]};
  return this.save();
};
module.exports = mongoose.model('User', userSchema);
