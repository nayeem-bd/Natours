const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');


const router = express.Router();

router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.get('/logout',authController.logout);


router.patch('/resetPassword/:token',authController.resetPassword);
router.post('/forgotPassword',authController.forgotPassword);

//this middleware call before next operations ,this protects next all
router.use(authController.protect);

router.patch('/updatePassword',authController.updatePassword);
router.patch('/updateMe',userController.updateUserPhoto,userController.resizeUserPhoto,userController.updateMe);
router.delete('/deleteMe',userController.deleteMe);
router.get('/me',userController.getMe,userController.getUser);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;