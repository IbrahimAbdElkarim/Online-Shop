const express = require('express');
const User = require("../models/User");

const authController = require('../controllers/auth');
const {check, body}=require('express-validator');
const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login',
[
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password', 'Password has to be valid.')
    .isLength({ min: 5 })
    .isString()
    .trim()
], authController.postLogin);
router.get('/signup', authController.getSignup);
router.post('/signup',[check('email').isEmail()
.withMessage('please enter a valid email')
.custom((value,{req})=>{
return User.findOne({email:value}).then(userDoc=>{
    if(userDoc){
        return Promise.reject('Email Exists already, please pick adifferent one');
    }
});
})
.normalizeEmail(),
body('password','please enter a password with only numbers , text and at least 5 characters .')
.isLength({min:5})
.isString()
.trim(),
body('confirmPassword')
.trim()
.custom((value,{req})=>{
    if(value != req.body.password){
        throw new Error('Password have to match !');
    }
    return true;
})

]
, authController.postSignup);
router.post('/logout', authController.postLogout);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);
module.exports = router;