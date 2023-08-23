const express = require('express');
const userController = require('./../controllers/userConntroller');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.use(authController.protect);
router.patch('/updateMyPassword', authController.updatePassword);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.UpdateMe
);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
module.exports = router;
