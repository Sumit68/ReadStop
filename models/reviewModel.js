const mongoose = require('mongoose');
const Book = require('./bookmodel');

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name of the reviewer cannot be empty!']
    },
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    book: {
      type: mongoose.Schema.ObjectId,
      ref: 'Book',
      required: [true, 'Review must belong to a Book.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ book: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'Book',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name'
  // });

  this.populate({
    path: 'user',
    select: 'name'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(bookId) {
  const stats = await this.aggregate([
    {
      $match: { book: bookId }
    },
    {
      $group: {
        _id: '$book', // grouping reviews from same book
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Book.findByIdAndUpdate(bookId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Book.findByIdAndUpdate(bookId, {
      ratingsQuantity: 0,
      ratingsAverage: null
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRatings(this.book);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.book);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
