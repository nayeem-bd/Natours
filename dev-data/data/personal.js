/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './../../config.env' });

const DB =  process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASS);
//console.log(DB);
mongoose.connect(DB,{
  useNewUrlParser:true,
  useUnifiedTopology: true
}).then(() =>{
  //console.log('DB connection successfully');
});
//console.log(process.env);
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8')); 
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8')); 
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8')); 

///importdata
const importData = async ()=>{
    try{
        await Tour.create(tours);
        await Review.create(reviews);
        await User.create(users,{validateBeforeSave:false});
        console.log('Data loaded successfully');
    }catch(err){
        console.log(err);
    }
};

//deleteAll
const deleteAll = async ()=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('deleted successfully');
    }
    catch(err){
        console.log(err);
    }
}

if(process.argv[2]==='--import'){
    importData();
}else {
    deleteAll();
}
console.log(process.argv);