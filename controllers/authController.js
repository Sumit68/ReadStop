const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/usermodel');
const AppError = require('./../utils/apperror');
const sendEmail = require('../utils/email');

// JWT (JSON Web Token) authentication is a method used to secure and authenticate requests in web applications. Here are the typical steps involved in JWT authentication:

// 1. User Registration: Users register an account by providing their credentials, such as username and password, to the server.

// 2. User Login: Users provide their credentials to the server (typically through a login form). The server verifies the provided credentials against the stored user data (e.g., in a database).

// 3. Token Generation: Upon successful authentication, the server generates a JWT for the authenticated user. The JWT consists of three parts: a header, a payload, and a signature. The header contains information about the token's algorithm and type, the payload includes user-specific data, and the signature ensures the token's integrity.

// 4. Token Issuance: The server sends the generated JWT back to the client as a response, typically within an HTTP header (e.g., Authorization: Bearer <token>).

// 5. Token Storage: The client (typically a web browser) receives the JWT and stores it securely. Common storage options include browser cookies, local storage, or session storage.

// 6. Subsequent Requests: For any subsequent requests that require authentication, the client includes the JWT in the request header (e.g., Authorization: Bearer <token>).

// 7. Token Verification: Upon receiving a request, the server verifies the authenticity and integrity of the JWT. It checks the signature using the secret key that was used to sign the token during generation. If the signature is valid, the server can trust the token's contents.

// 8. User Authentication: After verifying the token, the server extracts the user identity and any other necessary information from the token's payload. This allows the server to identify the user and perform authorization checks to ensure they have the necessary permissions for the requested action.

// 9. Response Handling: The server processes the request and sends back the appropriate response based on the user's authentication and authorization status.

// 10. Token Expiration and Renewal: JWTs often have an expiration time set in their payload. When a token expires, the client needs to obtain a new token by re-authenticating with the server. This process can be manual or automated, depending on the implementation.
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  try {
    const token = signToken(user._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (err) {
    console.log(err);
  }
};
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401
        )
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // get user from posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(err);
    // return next(
    //   new AppError('There was an error sending the email. Try again later!'),
    //   500
    // );
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // getting user from posted email
    const user = await User.findOne({ email: req.user.email }).select(
      '+password'
    );
    console.log(user);

    // check if pass entered is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    console.log('Password changed successfully');
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.isloggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.logout = async (req, res, next) => {
  try {
    const cookieOptions = {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    };

    res.cookie('jwt', 'dummycookie', cookieOptions);

    res.status(200).json({
      status: 'success'
    });
    console.log('Hello');
  } catch (err) {
    next();
  }
};
