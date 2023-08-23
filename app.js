const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
//const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/apperror');
const bookRouter = require('./routes/bookRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
console.log(__dirname);

// 1) MIDDLEWARES

// server to accept and parse incoming JSON data.
app.use(express.json());
app.use(cookieParser());

// Serving static files
console.log(__dirname);
app.use(express.static(path.join(__dirname, 'public')));

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// app.use((req, res, next) => {
//   console.log(req.cookies);
//   next();
// });
// Data sanitization against XSS
//app.use(xss());

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;

// app.all('*', (req, res, next) => { ... });: This line sets up a route
//handler that matches all HTTP methods (app.all) and any route ('*').
//It means that this handler will be executed for any incoming request that doesn't match any specific routes
//defined in the application.

//In summary, when this code is executed, any request that doesn't match
//any specific routes will trigger the middleware function in app.all('*').
//This middleware will call the next function with a 404 AppError.
//Then, the error will be handled by the global error handler middleware (globalErrorHandler) registered with app.use(globalErrorHandler).
//The global error handler will receive the error and generate a response to the client based on the error information.
