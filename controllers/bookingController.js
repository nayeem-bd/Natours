const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
// eslint-disable-next-line no-unused-vars
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');



exports.getCheckoutSession =catchAsync(async (req,res,next)=>{
    //1) get thee current booked tour
    const tour = await Tour.findById(req.params.tourId);

    //2) create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        //success_url:`${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
        cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id:req.params.tourId,
        line_items:[
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tour.name} Tour`,
                        description:tour.summary,
                        images:[`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`]
                    },
                    unit_amount: tour.price*100,
                },
                quantity: 1
            }
        ],
        mode:'payment'
    });

    //3) create session as response
    res.status(200).json({
        status:'success',
        session
    })
});

// exports.createBookingCheckout = catchAsync(async (req,res,next)=>{
//     // This is only temporary,because it's unsecure: everyone can book tour without payment
//     const {tour,user,price} = req.query;
//     if(!tour && !user && !price) return next();
//     await Booking.create({tour,user,price});

//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session =>{
    const tour = session.client_reference_id;
    const user = (await User.findOne({email:session.customer_email}))._id;
    const price = session.amount_total/100;
    await Booking.create({tour,user,price});
};

exports.webhookCheckout = (req,res)=>{
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    //console.log('req body : ',req.body);
    let event;
    try{
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }catch(err){
        //console.log(`❌ Error message: ${err.message}`);
        return res.status(400).send(`webhook error: ${err.message}`);
    }

    //console.log('✅ Success:', event.id);

    if(event.type === 'checkout.session.completed'){
        createBookingCheckout(event.data.object);
    }

    res.status(200).json({received:true});
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);