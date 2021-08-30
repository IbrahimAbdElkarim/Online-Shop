const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middlware/is-auth');
const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
router.post('/cart',isAuth, shopController.postCart);
router.get('/cart',isAuth, shopController.getCart);
 router.post('/cart-delete-item',isAuth, shopController.deleteCartItem);
router.get('/orders',isAuth, shopController.getOrders);


// router.post('/create-order',isAuth, shopController.postOrder);
 router.get('/orders/:orderId',isAuth, shopController.getInvoices);
router.get('/checkout', isAuth, shopController.getCheckout);
router.get('/checkout/success', isAuth, shopController.getCheckoutSuccess);
router.get('/checkout/cancel', isAuth, shopController.getCheckout);

module.exports = router;