const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res,next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if(!doc){
        return next(new AppError('The Id is not valid',404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    }); 
});

exports.updateOne = Model => catchAsync(async (req, res,next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id,req.body,{
        new : true,
        runValidators:true
    });

    if(!doc){
        return next(new AppError('The Id is not valid',404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data:doc
        }
    });   
});

exports.createOne = Model => catchAsync(async (req, res,next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            data : doc
        }
    }); 
});

exports.getOne = (Model,popOptions) => catchAsync(async (req, res,next) => {
    // eslint-disable-next-line prefer-const
    let query = Model.findById(req.params.id);
    if(popOptions){
        query.populate(popOptions);
    }
    const doc = await query;
    if(!doc){
        return next(new AppError('The Id is not valid',404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });   
});

exports.getAll = Model => catchAsync(async (req, res,next) => {
    //filer review by tour
    let filter = {};
    if(req.params.tourId) filter ={tour:req.params.tourId};

    //execute query
    const feature = new APIFeatures(Model.find(filter),req.query).filter().sort().limitFields().paginate();
    const doc = await feature.query;
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data:doc
        }
    });  
});