const bcryptjs = require('bcryptjs');
const User = require("../models/User");
const nodemailer = require('nodemailer');
const nodemailerSendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport(nodemailerSendgridTransport({
  auth: {
    api_key: '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'
  }
}));

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};


exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcryptjs.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            //save the session
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              // console.log(err);

               res.redirect('/');

            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          //   console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => {
      const error =new Error(err);
      error.httpStatusCode=500;
      next(error);    });
};


exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};


exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  return bcryptjs
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
      // return transporter.sendMail({
      //   to: email,
      //   from: 'ibr291996@gmail.com',
      //   subject: 'Signup succeeded!',
      //   html: '<h1>You successfully signed up!</h1>'
      // });
    })
    .catch(err => {
      const error =new Error(err);
      error.httpStatusCode=500;
      next(error);    });
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    res.redirect('/');
  });
};



exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message

  });
};


exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account With that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/login');
        return transporter.sendMail({
          to: req.body.email,
          from: 'ibr291996@gmail.com',
          subject: 'Password Reset!',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `          });
      })
      .catch(err => {
        const error =new Error(err);
        error.httpStatusCode=500;
        next(error);      });
  });

};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      // console.log(user);

      if (!user) {
        req.flash('error', 'Token Expired or,No account With that email found.');
        return res.redirect('/reset');
      }
      console.log(user);
      res.render('auth/new-password', {
        path: '/reset',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });

    }).catch(err => {
      const error =new Error(err);
      error.httpStatusCode=500;
      next(error);    })


};

exports.postNewPassword = (req, res, next) => {
  const newpassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetuser;
  // let message = req.flash('error');
  // if (message.length > 0) {
  //   message = message[0];
  // } else {
  //   message = null;
  // }
  // console.log(userId);
  // console.log(passwordToken);

  User.findOne({ _id: userId, resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      //console.log(user);

      if (!user) {
        req.flash('error', 'Token Expired or,No account With that email found.');
        return res.redirect('/reset');
      }
      resetuser = user;
      return bcryptjs
        .hash(newpassword, 12)
        .then(hashpass => {
          resetuser.password = hashpass;
          resetuser.resetToken = undefined;
          resetuser.resetTokenExpiration = undefined;
          return resetuser.save();
        })
        .then(result => {
          res.redirect('/login');
        })


    }).catch(err => {
      const error =new Error(err);
      error.httpStatusCode=500;
      next(error);    })


};