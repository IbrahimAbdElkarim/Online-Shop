const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require("stripe")("sk_test_51Iop11BCIKgFgGreabA5qwzVHE3OdyD58z6BT9c6RBBwbBmRTe1r7k4To7pkelo4EJwuim7XyZIUOqEWDOhUcCsE00EBES729j");

const Product = require('../models/product');
const Order = require('../models/Order');
const Item_Per_Page = 1;

exports.getProducts = (req, res, next) => {
  const page = + req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(total_items => {
      totalItems = total_items;
      return Product.find()
        .skip((page - 1) * Item_Per_Page)
        .limit(Item_Per_Page)
    })

    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'products',
        path: '/products',
        currentPage: page,
        hasNextPage: Item_Per_Page * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / Item_Per_Page)

      });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .then(
      product => {
        // console.log(product);
        res.render('shop/product-detail', {
          product: product,
          pageTitle: product.title,
          path: '/products'
        });
      })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = + req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(total_items => {
      totalItems = total_items;
      return Product.find()
        .skip((page - 1) * Item_Per_Page)
        .limit(Item_Per_Page)
    })

    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: Item_Per_Page * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / Item_Per_Page)

      });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.prodId')
    .execPopulate()
    .then(user => {
      //  console.log('user', user.cart.items);
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });

    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};
module.exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      // console.log('product', product);
      //console.log('req.user', req.user);
      return req.user.addToCart(product);
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    })
};



exports.deleteCartItem = (req, res, next) => {
  const prodId = req.body.productId;
  //console.log('prodId',prodId);

  req.user.removeFromCart(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    })

};
exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      // console.log('getOrders', orders);
      res.render('shop/orders', {
        path: '/orders',
        orders: orders,
        pageTitle: 'Your Orders'
      });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    })

};



exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate('cart.items.prodId')
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      products.forEach(p => {
        total += p.quantity * p.prodId.price;
      });

return stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: products.map(p=>{
    return{
      name:p.prodId.title,
      description:p.prodId.description,
      amount:p.prodId.price * 100,
      currency: 'usd',
      quantity:p.quantity
    };
  }),
  success_url: req.protocol + '://' + req.get('host') + '/checkout/success' ,
  cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'

});
    })
    .then(session=>{
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      console.log(err);
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user.populate('cart.items.prodId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {
          quantity: i.quantity,
          product: { ...i.prodId._doc }
        }
      });
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user
        }
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      console.log(err);
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user.populate('cart.items.prodId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {
          quantity: i.quantity,
          product: { ...i.prodId._doc }
        }
      });
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user
        }
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      console.log(err);
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // next(error);
    });
};

exports.getInvoices = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId).then(order => {
    if (!order) {
      return next(new Error('No Order Found !'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error('Un Authorized !'));
    }

    const invoiceName = 'invoice-' + orderId + '.pdf';

    const invoicePath = path.join('invoices', invoiceName);

    // Create a document
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="' + invoiceName + '"'
    );
    // Pipe its output somewhere, like to a file or HTTP response
    // See below for browser usage
    doc.pipe(fs.createWriteStream(invoicePath));
    doc.pipe(res);
    ///////
    doc.fontSize(26).text('Invoice', {
      underline: true
    });
    doc.text('-----------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      doc
        .fontSize(14)
        .text(
          prod.product.title +
          ' - ' +
          prod.quantity +
          ' x ' +
          '$' +
          prod.product.price
        );
    });
    doc.text('---');
    doc.fontSize(20).text('Total Price: $' + totalPrice);

    //////////
    doc.end();

    // file.pipe(res);
  }

  ).catch(err => {
    next(err);
  })



};

