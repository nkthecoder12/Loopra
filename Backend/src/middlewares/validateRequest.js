const { body, param, query, validationResult } = require('express-validator');

// Validation middleware factory
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Common validation chains
const rideCreationValidation = [
  body('pickupLocation.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Pickup latitude must be between -90 and 90'),
  
  body('pickupLocation.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Pickup longitude must be between -180 and 180'),
  
  body('pickupLocation.address')
    .optional()
    .isString()
    .withMessage('Pickup address must be a string'),
  
  body('dropLocation.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Drop latitude must be between -90 and 90'),
  
  body('dropLocation.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Drop longitude must be between -180 and 180'),
  
  body('dropLocation.address')
    .optional()
    .isString()
    .withMessage('Drop address must be a string'),
  
  handleValidationErrors
];

const rideIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ride ID format'),
  
  handleValidationErrors
];

const paymentVerificationValidation = [
  body('rideId')
    .isMongoId()
    .withMessage('Invalid ride ID format'),
  
  body('razorpay_order_id')
    .isString()
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  
  body('razorpay_payment_id')
    .isString()
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  
  body('razorpay_signature')
    .isString()
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  
  handleValidationErrors
];

const userRegistrationValidation = [
  body('name')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

const userLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const otpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('otp')
    .isString()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  
  handleValidationErrors
];

const ratingValidation = [
  param('rideId')
    .isMongoId()
    .withMessage('Invalid ride ID format'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters'),
  
  handleValidationErrors
];

const driverLocationValidation = [
  body('rideId')
    .isMongoId()
    .withMessage('Invalid ride ID format'),
  
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  handleValidationErrors
];

module.exports = {
  rideCreationValidation,
  rideIdValidation,
  paymentVerificationValidation,
  userRegistrationValidation,
  userLoginValidation,
  otpValidation,
  ratingValidation,
  driverLocationValidation,
  handleValidationErrors
};