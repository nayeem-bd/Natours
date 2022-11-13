const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getOverview = catchAsync(async (req,res,next)=>{
    // 1) get tour data from collection
    const tours = await Tour.find();

    // 2) build template
    // 3) render that template using tour data from 1)


    res.status(200).render('overview',{
        title:'All Tours',
        tours
    });
});

exports.getTour =catchAsync(async (req,res,next)=>{
    const tour = await Tour.findOne({slug:req.params.slug}).populate({
        path:'reviews',
        feilds:'review rating user'
    });
    //console.log(tour);
    if(!tour){
        return next(new AppError('Tour name is not correct',404));
    }
    res.status(200).render('tour',{
        title:`${tour.name} Tour`,
        tour
    });
});

exports.getLoginForm = (req,res)=>{
    res.status(200).render('login',{
        title:'Log in your account'
    });
};

exports.getAccount = (req,res)=>{
    res.status(200).render('account',{
        title:'Your Account'
    });
};

exports.getMyTours = catchAsync(async (req,res,next)=>{
    //1) find all bookingS
    const bookings = await Booking.find({user:req.user.id});

    //2) Find tours with returned IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({_id:{$in:tourIDs}});

    res.status(200).render('overview',{
        title: 'My Tours',
        tours
    });

});

exports.updateUserData =catchAsync(async (req,res,next)=>{
    const updatedUser = await User.findByIdAndUpdate(req.user.id,{
        name: req.body.name,
        email: req.body.email
    },{
        new:true,
        runValidators:true
    });
    res.status(200).render('account',{
        title:'Your Account',
        user:updatedUser
    });
});