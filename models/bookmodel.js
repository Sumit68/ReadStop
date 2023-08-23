const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A book must have a title'],
    unique: true,
    trim: true,
    maxlength: [40, 'A book title must have less or equal then 40 characters'],
    minlength: [10, 'A book title must have more or equal then 10 characters']
    // validate: [validator.isAlpha, 'Tour title must only contain characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'A book must have a description.'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'A book must have a Price.']
  },
  ratingsAverage: {
    type: Number,
    default: null,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0']
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  author: {
    type: String,
    required: [true, 'A book must have an author.']
  },
  language: {
    type: String,
    required: [true, 'A book must have language']
  },
  country: {
    type: String,
    default: 'NA'
  },
  imageLink: {
    type: String,
    required: [true, 'A book must have a front image']
  },
  year: {
    type: Number
  },
  pages: {
    type: Number,
    validate: {
      validator: val => {
        // eslint-disable-next-line no-unused-expressions
        val > 100;
      },
      message: 'A book pages ({VALUE}) mush be greater than 100.'
    }
  },
  genre: {
    type: String,
    required: [true, 'A book must have an genre.']
  },
  link: {
    type: String
  }
});

bookSchema.pre('save', function(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
