const joi = require('joi');

exports.signupSchema = joi.object({
    registrationDetails: joi.object({
        fullName: joi.string().required().pattern(new RegExp('^[A-Za-z ]+$')),
        userName: joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
        email: joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] }}),
        password: joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
    }).required(),
    role: joi.string().valid('instructor', 'student', 'admin').required()
});


exports.loginSchema = joi.object({
    email: joi.string().min(6).max(60).required().email({ tlds:{allow:['com','net']}}),
    password:joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'))
})


exports.acceptCodeSchema = joi.object({
    email: joi.string().min(6).max(60).required().email({tlds:{allow:['com','net']}}),
    providedCode: joi.number().required(),

})


exports.changePasswordSchema = joi.object({
  oldPassword:joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
    newPassword:joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$')),
})



// ✅ Validation schema for OTP and email
exports.acceptFpCodeSchema = joi.object({
    email: joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] } }),
    providedCode: joi.number().required(),
});

exports.acceptFpSchema = joi.object({
    email: joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] } }),
    newPassword: joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')),
});