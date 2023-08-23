const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Book = require('../models/bookmodel');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = async (req, res, next) => {
  try {
    // 1) Get the currently booked Book

    const book = await Book.findById(req.params.bookId);
    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: book.price * 100 * 82,
            product_data: {
              name: `${book.title}`,
              description: `${book.description}`
              //images: ['https://example.com/t-shirt.png']
            }
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get(
        'host'
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/book/${book.slug}`,
      metadata: { BookId: book.id }
    });

    // 3) Create session as response
    res.status(200).json({
      status: 'success',
      session
    });
  } catch (err) {
    next(err);
  }
};

exports.getsucesspage = async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.query.session_id
    );
    const line_items = await stripe.checkout.sessions.listLineItems(
      req.query.session_id
    );

    const price = line_items.data[0].amount_total / 100;
    const book = session.metadata.BookId;
    const user = req.user.id;

    await Booking.create({ book, user, price });
    //console.log(req.user);
    res.status(200).render('success');
  } catch (err) {
    next(err);
  }
};
