const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router({ mergeParams: true });

router.use(authController.isloggedIn);
router.get('/', viewsController.getBooks);
router.get('/book/:slug', viewsController.getBook);
router.get('/login', viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);

router.get('/success', authController.protect, bookingController.getsucesspage);

router.get('/my-books', authController.protect, viewsController.getMyBooks);

// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewsController.updateUserData
// );

module.exports = router;
