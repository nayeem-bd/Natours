const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//start express app
const app = express();

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
// global middleware
//serving static file
app.use(express.static(path.join(__dirname,'public')));
//set security http headers
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// rate limier per ip
const limiter = rateLimit({
    max : 100,
    windowMs : 60*60*1000,
    message:'you tries many times.Try again after a hour'
});

app.use('/api',limiter);

//middleware
// body parser ,reading data from body into req.body
app.use(express.json({limit:'10kb'}));
app.use(express.urlencoded({extended:true,limit:'10kb'}));
app.use(cookieParser());

//data sanitize for noSql injection
app.use(mongoSanitize());

//data sanitize for xss
app.use(xss());

//prevent parameter pollution
app.use(hpp({
    whitelist:['duration','price','difficulty','ratingsQuantity','maxGroupSize','ratingsAverage']
}));


app.use(compression());

// app.use((req,res,next)=>{
//     // eslint-disable-next-line no-console
//     console.log("first custom middleware");
//     next();
// });

//test middleware
app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    next();
});



// app.get('/api/v1/tours',getAllTours);
// app.get('/api/v1/tours/:id',getTour);
// app.patch('/api/v1/tours/:id',updateTour);
// app.delete('/api/v1/tours/:id',deleteTour);
// app.post('/api/v1/tours',createTour);

// ROUTES 
app.use('/',viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.use('/api/v1/bookings',bookingRouter);


app.all('*',(req,res,next)=>{
    // res.status(404).json({
    //     status:'fail',
    //     message: `Can't find ${req.originalUrl} on this server`
    // });
    const err = new AppError( `Can't find ${req.originalUrl} on this server`,404);
    next(err);
});

app.use(globalErrorHandler);

module.exports = app;