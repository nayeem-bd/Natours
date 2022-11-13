const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRoutes = require("./reviewRoutes");

const   router = express.Router();

// router.param('id',tourController);

router.use('/:tourId/reviews',reviewRoutes);

router.route('/top-5-cheap').get(tourController.aliseTopTours,tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect,authController.restrictTo('admin','lead-guide','guide'),tourController.getMonthlyPlan);
router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);
// /tours-within/250/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router.route('/')
    .get(tourController.getAllTours)
    .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.createTour);
router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.uploadTourImages,tourController.resizeTourImages,tourController.updateTour)
    .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteTour);

//router.route('/:tourId/reviews').post(authController.protect,authController.restrictTo('user'),reviewController.createReview);

module.exports = router;