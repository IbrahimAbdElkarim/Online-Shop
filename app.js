const csrf = require('csurf');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const multer = require('multer');



const User = require('./models/User');



const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const errorController = require('./controllers/error');



const app = express();
const store = new MongoDBStore({
    uri: 'mongodb://localhost/startnode',
    collection: 'sessions'
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
})
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const upload = multer({ storage: storage, fileFilter: fileFilter })

app.set('view engine', 'ejs');
app.set('views', 'views');
const csrfProtection = csrf();


app.use(bodyParser.urlencoded({ extended: false }));

app.use(upload.single('image'));



app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id).then(user => {
        if (!user) {
            return next();
        }
        req.user = user;
        next();
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    });
});
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;

    res.locals.csrfToken = req.csrfToken();
    //console.log('req.csrfToken()',req.csrfToken());
    next();
});
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    console.log('error',error);
    res.redirect('/500');
})

mongoose.connect('mongodb://localhost/startnode', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(3000);
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    });
