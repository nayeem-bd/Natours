const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// eslint-disable-next-line arrow-body-style
const signToken = id =>{
    return jwt.sign({id: id},process.env.JWT_SECRET,{
        expiresIn : process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user,statusCode,res)=>{
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly : true        
    };
    if(process.env.NODE_ENV ==='production')cookieOptions.sucure = true;
    res.cookie('jwt',token,cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token: token,
        data : {
            user
        }
    });
}

exports.signup = catchAsync(async (req,res,next)=>{
    // const newUser = await User.create(req.body);
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role:req.body.role
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser,url).sendWelcome();

    createSendToken(newUser,201,res);
    // const token = signToken(newUser._id);

    // res.status(201).json({
    //     status: 'success',
    //     token: token,
    //     user : newUser
    // });
});

exports.login = catchAsync(async (req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return next(new AppError('Provide email and password'),400);
    }

    const user = await User.findOne({email}).select('+password');

    if(!user || !await user.correctPassword(password,user.password)){
        return next(new AppError('Invalid email or password',401));
    }

    createSendToken(user,200,res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });

});

exports.logout = (req,res)=>{
    res.cookie('jwt','loggedout',{
        expires: new Date(Date.now()+10*1000),
        httpOnly: true
    });
    res.status(200).json({status:'success'});
};

exports.protect = catchAsync(async (req,res,next)=>{
    //console.log(req.headers);
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
        //console.log(token);
    }
    else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if(!token){
        return next(new AppError('Your are not logged in. Please log in first',401));
    }
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    //console.log(decoded);
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user does not exits',401));
    }
    
    if(currentUser.changePasswordAfter(decoded.iat)){
        return next(new AppError('The user change password.please login again',401));
    }
    
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

//only for rendered pages, no errors!
exports.isLoggedIn = async (req,res,next)=>{
    if(req.cookies.jwt){
        try{
            // verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET);
            
            //check if user still exits
            const currentUser = await User.findById(decoded.id);
            if(!currentUser){
                return next();
            }

            // check if user change password after the token was issued
            if(currentUser.changePasswordAfter(decoded.iat)){
                return next();
            }

            // there is a logged in user
            res.locals.user = currentUser;
            return next();
        }catch(err){
            return next();
        }
    }
    next();
};


// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission',403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req,res,next)=>{

    const user = await User.findOne({email:req.body.email});
    if(!user){
        return next(new AppError('Email not found',404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});
    
    //send it to user's email
    try{
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user,resetUrl).sendPasswordReset();

        res.status(200).json({
            status:'success',
            message:'Your password reset link sent successfully'
        });        
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError('Error sending email,try again later',500));
    }

    
    //next();
});

exports.resetPassword = catchAsync(async(req,res,next)=>{
    //1)get user bases on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken:hashedToken,passwordResetExpire:{$gt:Date.now()}});
    //2)if token not expire,change password
    if(!user){
        return next(new AppError('Invalid token or expire',400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;

    await user.save();
    //3) update passwordChangeAt properties

    //4) login ,,send jwt token
    createSendToken(user,200,res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });


});

exports.updatePassword = catchAsync(async (req,res,next)=>{
    //1) get user from collection
    const user = await User.findById(req.user._id).select('+password');
    //console.log(user);
    //2) check current password if exits
    if(!user || !await user.correctPassword(req.body.currentPassword,user.password)){
        return next(new AppError('your current password is wrong',401));
    }
    //3) update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;

    await user.save();

    //4) loged in again
    createSendToken(user,200,res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });

});