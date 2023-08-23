const express = require('express');
const { ObjectId } = require('mongoose').Types;
const bookController = require('./../controllers/bookController');
const authController = require('../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

router.use('/:bookId/reviews', reviewRouter);
router
  .route('/')
  .get(authController.protect, bookController.getAllbooks)
  .post(bookController.createBook);

router.route('/get-stats').get(bookController.getBookStats);
router
  .route('/top-5-cheap')
  .get(bookController.aliasTopBooks, bookController.getAllbooks);
router
  .route('/:param')
  .get((req, res, next) => {
    const { param } = req.params;
    const isId = /^\d+$/.test(param); // Check if the parameter is numeric (assumed to be an ID)

    if (ObjectId.isValid(param)) {
      bookController.getBook(req, res, next);
    } else {
      bookController.getBookbytitle(req, res, next);
    }
  })
  .put((req, res, next) => {
    const { param } = req.params;
    const isId = /^\d+$/.test(param); // Check if the parameter is numeric (assumed to be an ID)

    if (ObjectId.isValid(param)) {
      bookController.updateBook(req, res, next);
    } else {
      bookController.updateBookbytitle(req, res, next);
    }
  })
  .delete((req, res, next) => {
    const { param } = req.params;
    if (ObjectId.isValid(param)) {
      bookController.deleteBook(req, res, next);
    } else {
      bookController.deleteBookbytitle(req, res, next);
    }
  });

module.exports = router;
