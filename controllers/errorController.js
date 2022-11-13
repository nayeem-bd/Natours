const AppError = require('../utils/appError');

const handleCastErrorDB = err =>{
    const message = `Invalid ${err.path} : ${err.value}`;
    return new AppError(message,400);
};

const handleDuplicateFieldsErrorDB = err =>{
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `${value} already in database.Use another one`;
    return new AppError(message,400);
};

const handleValidationErrorDB = err =>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Validation Error. ${errors.join('. ')}`;
    return new AppError(message,400);
};

const handleJWTError = () => new AppError('Invalid token! Please login again',401);
const handleTokenExpireError = () => new AppError('Your token has expired,login again',401);

const sendErrorDev = (err,req,res)=>{
    //API
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status : err.status,
            error : err,
            message : err.message,
            stack : err.stack
        });    
    }
    //Render
    return res.status(err.statusCode).render('error',{
        title:'Something went wrong',
        msg: err.message
    });

};

const sendErrorProd = (err,req,res)=>{
    //API
    if(req.originalUrl.startsWith('/api')){
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status : err.status,
                message : err.message
            });        
        }
        // eslint-disable-next-line no-console
        console.error('ERROR => ',err);
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong'
        });
    }
    //render 
    if(err.isOperational){
        return res.status(err.statusCode).render('error',{
            title:'Something went wrong',
            msg: err.message
        });       
    }
    // eslint-disable-next-line no-console
    console.error('ERROR => ',err);
    return res.status(err.statusCode).render('error',{
        title:'Something went wrong',
        msg: 'Please try again later'
    });
    
};

module.exports = (err,req,res,next)=>{
    err.statusCode = err.statusCode || 500 ;
    err.status = err.status || 'err' ;

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err,req,res);
    }
    else if(process.env.NODE_ENV === 'production'){
        let error =  JSON.parse(JSON.stringify(err));
        error.message = err.message;
        if(error.name === 'CastError'){
            error = handleCastErrorDB(err);
        }
        if(error.code === 11000){
            error = handleDuplicateFieldsErrorDB(err);
        }
        if(error.name === 'ValidationError'){
            error = handleValidationErrorDB(err);
        }
        if(error.name === 'JsonWebTokenError'){
            error = handleJWTError();
        }
        if(error.name === 'TokenExpiredError'){
            error = handleTokenExpireError();
        }
        
        sendErrorProd(error,req,res);
    }
}