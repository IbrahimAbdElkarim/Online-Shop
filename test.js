var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })
app.use(upload.single('image'));

//app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// const fileStorage = multer.diskStorage({
//   dest: (req, file, cb) => {
//     cb(null, 'images');
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + '-' + file.originalname);
//   }
// });

// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
//         cb(null, true);
//     } else {
//         cb(null, false);
//     }
// };