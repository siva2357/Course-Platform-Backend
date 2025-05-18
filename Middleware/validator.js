const joi = require('joi');

exports.signupSchema = joi.object({
    registrationDetails: joi.object({
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
