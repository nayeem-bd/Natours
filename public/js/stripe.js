/* eslint-disable */
import axios from "axios";
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51M3OXMKXhuumDUNQ2m2vyaNrsqLaitwvRVkZQv9I1XQVGz0DoFWawuSIrugJrTMSeZLJl4hsVxDiliKOQhGhQF4l00rsh0elib');


export const bookTour = async tourId =>{
    try{
        //1) get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        //console.log(session);

        //2) create checkout from+ process + charge credit card
        await stripe.redirectToCheckout({
            sessionId:session.data.session.id
        });
    }catch(err){
        console.log(err);
        showAlert('error',err);
    }
}