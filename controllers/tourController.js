/* eslint-disable no-unused-vars */
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }else{
        cb(new AppError('Not an Image! Please upload only image',400),false);
    }
}

const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
});

exports.uploadTourImages = upload.fields([
    {name:'imageCover',maxCount:1},
    {name:'images',maxCount:3}
]);

exports.resizeTourImages = catchAsync(async(req,res,next)=>{
    //console.log(req.files);

    if(!req.files.imageCover || !req.files.images)return next();

    //1) Cover images
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000,1333).toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${req.body.imageCover}`);
    //2)images
    req.body.images = [];
    await Promise.all(req.files.images.map(async(file,i)=>{
        const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
        await sharp(file.buffer)
        .resize(2000,1333).toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    })
    );

    next();
});


exports.aliseTopTours = (req,res,next)=>{
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,duration,ratingsAverage';
    next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res,next) => {
//     //execute query
//     const feature = new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate();
//     const tours = await feature.query;
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours
//         }
//     });  
    
//     // try{

//     // }catch(err){
//     //     res.status(404).json({
//     //         status:'fail',
//     //         message: err
//     //     });
//     // }
// });

exports.getTour = factory.getOne(Tour,{path:'reviews'});

// exports.getTour = catchAsync(async (req, res,next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews');

//     if(!tour){
//         return next(new AppError('The Id is not valid',404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });   
//     //  try{

//     // }catch(err){
//     //     res.status(404).json({
//     //         status:'fail',
//     //         message: err
//     //     });
//     // }

// });

exports.createTour = factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res,next) => {
//     //console.log(req.body);
//     const newTour = await Tour.create(req.body);
//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour : newTour
//         }
//     }); 

//     // try{
       
//     // }catch(err){
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }
// });

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour =catchAsync(async (req, res,next) => {
//     const newTour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
//         new : true,
//         runValidators:true
//     });

//     if(!newTour){
//         return next(new AppError('The Id is not valid',404));
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour : newTour
//         }
//     });   
    
//     // try{
     
//     // }catch(err){
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }
// });

exports.deleteTour = factory.deleteOne(Tour);


// exports.deleteTour =catchAsync(async (req, res,next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if(!tour){
//         return next(new AppError('The Id is not valid',404));
//     }
//     res.status(204).json({
//         status: 'success',
//         data: null
//     }); 
//     // try{

//     // }catch(err){
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         data: err
//     //     });
//     // }
// });

exports.getTourStats = catchAsync(async (req,res,next)=>{
const stats = await Tour.aggregate([
        {
            $match : {ratingsAverage:{$gte : 4.5}}
        },
        {
            $group :{
                _id : {$toUpper:'$difficulty'},
                numTours : {$sum:1},
                numRating : {$sum:'$ratingsQuantity'},
                avgRating : {$avg:'$ratingsAverage'},
                avgPrice : {$avg:'$price'},
                minPrice : {$min:'$price'},
                maxPrice : {$max:'$price'}
            }
        },
        {
            $sort:{
                avgPrice : 1
            }
        },
    ]); 
    res.status(200).json({
        status: 'success',
        data: {
            tour : stats
        }
    });
    
    // try{
          
    // }catch(err){
    //     res.status(404).json({
    //         status: 'fail',
    //         data: err
    //     });
    // }
});

exports.getMonthlyPlan = catchAsync(async (req,res,next)=>{
const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind : '$startDates'
        },
        {
            $match : {
                startDates : {
                    $gte : new Date(`${year}-01-01`),
                    $lte : new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group : {
                _id : {$month : '$startDates'},
                numTour : {$sum:1},
                tours : {$push : '$name'}
            }
        },
        {
            $addFields : {
                month : '$_id'
            }
        },
        {
            $project : {
                _id : 0
            }
        },
        {
            $sort : {
                numTour : 1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            tour : plan
        }
    });   

    // try{
        
    // }catch(err){
    //     res.status(404).json({
    //         status: 'fail',
    //         data: err
    //     }); 
    // }
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.05487664249163,-118.24557801788622/unit/mi

exports.getToursWithin = catchAsync(async (req,res,next)=>{
    const {distance,latlng,unit} = req.params;
    const [lat,lng] = latlng.split(',');

    const radius = unit === 'mi'?distance/3963.2 : distance/6378.1;

    if(!lat || !lng){
        next(new AppError('Please provide latitude ans longitude in th format lat,lng.',400));    
    }

    const tours = await Tour.find({startLocation: { $geoWithin: { $centerSphere: [[lng,lat],radius] } }})

    res.status(200).json({
        status:'success',
        results : tours.length,
        data:{
            data:tours
        }
    });
    

});

// /distances/:latlng/unit/:unit
exports.getDistances = catchAsync(async (req,res,next)=>{
    const {latlng,unit} = req.params;
    const [lat,lng] = latlng.split(',');
    if(!lat || !lng){
        next(new AppError('Please provide latitude ans longitude in th format lat,lng.',400));    
    }

    const multiplier = unit ==='mi'?0.000621371:0.001;

    const distances = await Tour.aggregate([
        {
            $geoNear:{
                near:{
                    type:'Point',
                    coordinates:[lng*1,lat*1]
                },
                distanceField:'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project:{
                distance : 1,
                name : 1
            }
        }
    ]);
    res.status(200).json({
        status:'success',
        data:{
            data:distances
        }
    });
});