/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51NT360SCIwyAb61FvilJSh29cuzirH3oddTQHN7bIHA4EEx9Opdy7hddudYTuVpuKiU7dPnYzVF4pXkWovLIgG7800NAxubaCM'
);

export const bookTour = async bookId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${bookId}`
    );
    console.log(bookId);
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(`Error ${err}`);
    console.error('Error response:');
    console.error(err.response.data); // ***
    console.error(err.response.status); // ***
    console.error(err.response.headers);
    showAlert('error', err);
  }
};
