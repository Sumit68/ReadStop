const Review = require('./../models/reviewModel');
const mongoose = require('mongoose');
const AppError = require('./../utils/apperror');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  console.log(req.params);
  console.log(req.user);
  if (!req.body.book) req.body.book = req.params.bookId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ book: req.params.bookId });

    res.status(200).json({
      status: 'success',
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

exports.getReview = async (req, res, next) => {
  try {
    const reviews = await Review.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        Book: newReview
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getReviewbyme = async (req, res, next) => {
  try {
    const review = await Review.find({
      user: mongoose.Types.ObjectId(req.user.id)
    });
    res.status(201).json({
      message: 'success',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.updateOne(
      {
        $and: [{ _id: req.params.id }, { user: req.user.id }]
      },
      req.body
    );

    if (review.nModified === 0) {
      return next(
        new AppError('You do not have permission to edit this document', 500)
      );
    }
    res.status(201).json({
      message: 'success',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;

    // Find the review by ID
    const review = await Review.findById(reviewId);

    // Check if the review exists
    if (!review) {
      return next(new AppError('No review with this id exist', 404));
    }

    // Check if the user is an admin
    if (req.user.role === 'admin') {
      // Delete the review if the user is an admin
      await Review.deleteOne({ _id: reviewId });
      return res.status(200).json({ message: 'Review deleted successfully' });
    }

    // Check if the review is created by the current user
    console.log(review.user);
    if (review.user.id !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this review' });
    }

    // Delete the review if the user is the creator
    await Review.deleteOne({ _id: reviewId });
    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
};
