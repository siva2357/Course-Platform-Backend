const joi = require('joi');
const instructor = require('../Authentication/instructorModel');
const transport = require("../Middleware/sendMail");
const { hmacProcess } = require("../utils/hashing");

// ✅ Joi validation schema for verifying the OTP and email
exports.acceptCodeSchema = joi.object({
    email: joi.string().min(6).max(60).required().email({ tlds: { allow: ['com', 'net'] } }),
    providedCode: joi.number().required(),
});

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
        // ✅ Check if the user exists in the Instructor collection only
        const instructorUser = await instructor.findOne({ 'registrationDetails.email': email });

        if (!instructorUser) {
            return res.status(404).json({ success: false, message: "User with this email does not exist!" });
        }

        // ✅ Generate a 6-digit OTP and hash it
        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        // ✅ Send the OTP via email
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: "Verification Code for Account Verification",
            html: `<h1>Your OTP for account verification: ${codeValue}</h1>`
        });

        // ✅ Save the OTP hash and timestamp if email was successfully sent
        if (info.accepted[0] === email) {
            instructorUser.registrationDetails.verificationCode = hashedCodeValue;
            instructorUser.registrationDetails.verificationCodeValidation = Date.now();
            await instructorUser.save();
        }

        res.status(200).json({ success: true, message: `OTP has been sent to ${email}. Please check your inbox.` });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while sending the OTP. Please try again." });
    }
};


exports.verifyCode = async (req, res) => {
    // ✅ Validate incoming request using Joi
    const { error } = exports.acceptCodeSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, providedCode } = req.body;

    try {
        // ✅ Find the user only in Instructor collection
        const instructorUser = await instructor.findOne({
            'registrationDetails.email': email
        }).select("+registrationDetails.verificationCode +registrationDetails.verificationCodeValidation");

        if (!instructorUser) {
            return res.status(404).json({ success: false, message: "User with this email does not exist!" });
        }

        // ✅ Check if verification code exists
        if (!instructorUser.registrationDetails.verificationCode || !instructorUser.registrationDetails.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: "No verification code found!" });
        }

        // ✅ Check for expiry (5 minutes window)
        if (Date.now() - instructorUser.registrationDetails.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Verification code has expired!" });
        }

        // ✅ Compare provided code after hashing
        const hashedCodeValue = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue === instructorUser.registrationDetails.verificationCode) {
            // ✅ Mark user as verified and clean up verification fields
            instructorUser.registrationDetails.verified = true;
            instructorUser.registrationDetails.verificationCode = undefined;
            instructorUser.registrationDetails.verificationCodeValidation = undefined;
            await instructorUser.save();

            return res.status(200).json({
                success: true,
                message: "User account has been verified successfully.",
                role: 'Instructor' // Optional: Return role
            });
        }

        return res.status(400).json({ success: false, message: "Invalid verification code!" });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during code verification." });
    }
};


