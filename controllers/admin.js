const Product = require('../models/product');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []

  });
};

exports.postAddProduct = (req, res, next) => {

  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image',
      validationErrors: []
    });
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }


  const product = new Product({
    //  _id: new mongoose.Types.ObjectId('60893e21cb5b1a1c10349672'),
    title: title,
    imageUrl: image.path,
    price: price,
    description: description,
    userId: req.user
  });
  product.save()
    .then(result => {
      console.log("product created successfully");
      res.redirect('/admin/products');
    }).catch(err => {
      //console.log(err);
      //res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'

      });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const id = req.params.productId;
  Product.findById(id)
    .then(product => {
      if (!product) {
        res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      product.price = updatedPrice;
      product.description = updatedDesc;
      return product.save()
        .then(result => {
          console.log('Updated successfully')
          res.redirect('/admin/products');
        });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });

};

exports.deleteproduct = (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .then(product => {
      if (!product) {
       // console.log('Product not found.');

        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: id, userId: req.user._id });
    })

    .then(result => {
      console.log('destroyed successfully')
     // res.redirect('/admin/products');
     res.status(200).json({message:'Success!'});
    }).catch(err => {
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // next(error);
      res.status(500).json({message:'Deleting Product Fail.'});

    });
};