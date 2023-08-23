const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Book = require('../models/bookmodel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');

exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    //Render overview template using tour data
    res.status(200).render('overview', {
      title: 'All books',
      books
    });
  } catch (err) {
    next(err);
  }
};

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ slug: req.params.slug });
    const reviews = await Review.find({ book: book._id });
    res.status(200).render('book', {
      title: book.title,
      book,
      reviews
    });
  } catch (err) {
    next(err);
  }
};

exports.getAccount = async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your Account'
  });
};

exports.getMyBooks = async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find Books with the returned IDs
  const BookIds = bookings.map(el => el.book);
  const books = await Book.find({ _id: { $in: BookIds } });

  res.status(200).render('overview', {
    title: 'My Books',
    books
  });
};
