const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name'],
    },
    email: {
        type: String,
        required: [true, 'User must have a email'],
        lowercase: true,
        unique: true,
        validate: [validator.isEmail, 'provide a valid email'],
    },
    photo: {type:String,
        default:'default.jpg'
    },
    role:{
        type: String,
        enum: ['user','guide','lead-guide','admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true,'Enter a password'],
        minlength: 8,
        select : false
    },
    passwordConfirm: {
        type: String,
        required: [true,'Confirm your password'],
        validate: {
            // this works on create and save
            validator : function(el){
                return el === this.password;
            },
            message: 'Password are not same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    active:{
        type : Boolean,
        default: true,
        select:false
    }
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password,12);
    this.passwordConfirm = undefined;
});

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew)return next();
    this.passwordChangedAt = Date.now()-1000;
    //console.log(this.passwordChangedAt);
    next();
});

userSchema.pre(/^find/,function(next){
    this.find({active : {$ne : false}});
    next();
})

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        //console.log(changedTimestamp,JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }

    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpire = Date.now() + 10*60*1000;

    return resetToken;
}

const User = mongoose.model('User',userSchema);

module.exports = User;