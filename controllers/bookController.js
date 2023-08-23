const Book = require('./../models/bookmodel');
const APIFeatures = require('./../utils/apifeatures');
const AppError = require('./../utils/apperror');

exports.aliasTopBooks = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratings,price';
  next();
};

exports.getAllbooks = async (req, res, next) => {
  try {
    console.log(req.query);
    const features = new APIFeatures(Book.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //const tours = await features.query;
    //This code executes both asynchronous operations (Book.find() and Book.count()) concurrently using Promise.all().
    const [books, numofbooks] = await Promise.all([
      //Book.find(),
      features.query,
      Book.count()
    ]);
    res.status(200).json({
      status: 'success',
      results: numofbooks,
      data: {
        books
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createBook = async (req, res, next) => {
  try {
    // const newBook = new Book({})
    // newBook.save()

    const newBook = await Book.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        Book: newBook
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.param);
    if (!book) {
      return next(new AppError('No book found with that id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        book
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookbytitle = async (req, res, next) => {
  try {
    const book = await Book.find({ title: req.params.param });
    if (!book) {
      return next(new AppError('No book found with that title', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        book
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.param, req.body, {
      new: true,
      runValidators: true
    });

    if (!book) {
      return next(new AppError('No book found with that id', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Book updated',
      data: {
        book
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateBookbytitle = async (req, res, next) => {
  try {
    const book = await Book.findOneAndUpdate(
      { title: req.params.param },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!book) {
      return next(new AppError('No book found with that title', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        book
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    await Book.findByIdAndDelete(req.params.param);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
exports.deleteBookbytitle = async (req, res, next) => {
  try {
    const book = await Book.findOneAndDelete({ title: req.params.param });
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookStats = async (req, res, next) => {
  try {
    const stats = await Book.aggregate([
      {
        $match: { ratings: { $gte: 4.5 } }
      },
      {
        $group: {
          _id: { $toUpper: '$genre' },
          numBooks: { $sum: 1 },
          avgRating: { $avg: '$ratings' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { avgPrice: 1 }
      }
      // {
      //   $match: { _id: { $ne: 'EASY' } }
      // }
    ]);
    res.status(200).json({
      status: 'success',
      message: 'Stats generated',
      data: {
        stats
      }
    });
  } catch (err) {
    next(err);
  }
};
