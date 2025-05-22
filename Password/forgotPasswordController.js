const joi = require('joi');
const instructor = require('../Authentication/instructorModel');
const transport = require("../Middleware/sendMail");
const { hmacProcess } = require("../utils/hashing");
const bcrypt = require('bcryptjs');

// ✅ Step 1: Send Forgot Password OTP
exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;

    try {
        const existingUser = await instructor.findOne({ 'registrationDetails.email': email });

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "Instructor with this email does not exist!" });
        }

        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.registrationDetails.email,
            subject: "OTP for resetting your password",
            html: `<h1>Your OTP is: ${codeValue}</h1>`,
        });

        existingUser.registrationDetails.forgotPasswordCode = hashedCodeValue;
        existingUser.registrationDetails.forgotPasswordCodeValidation = Date.now();
        await existingUser.save();

        res.status(200).json({ success: true, message: `OTP has been sent to ${email}. Please check your inbox.` });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while sending the OTP." });
    }
};

// ✅ Step 2: Verify OTP
exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode } = req.body;

    try {
        const existingUser = await instructor.findOne({ 'registrationDetails.email': email }).select("+registrationDetails.forgotPasswordCode +registrationDetails.forgotPasswordCodeValidation");

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "Instructor with this email does not exist!" });
        }

        if (!existingUser.registrationDetails.forgotPasswordCode || !existingUser.registrationDetails.forgotPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: "No verification code found!" });
        }

        if (Date.now() - existingUser.registrationDetails.forgotPasswordCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "OTP expired!" });
        }

        const hashedCodeValue = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue === existingUser.registrationDetails.forgotPasswordCode) {
            existingUser.registrationDetails.forgotPasswordCode = undefined;
            existingUser.registrationDetails.forgotPasswordCodeValidation = undefined;
            await existingUser.save();

            return res.status(200).json({ success: true, message: "OTP verified. You can now reset your password." });
        }

        return res.status(400).json({ success: false, message: "Invalid OTP!" });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Error verifying OTP." });
    }
};

// ✅ Step 3: Reset Password
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const existingUser = await instructor.findOne({ 'registrationDetails.email': email });

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "Instructor with this email does not exist!" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character." });
        }

        const saltRounds = 12;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        existingUser.registrationDetails.password = hashedPassword;

        existingUser.registrationDetails.forgotPasswordCode = undefined;
        existingUser.registrationDetails.forgotPasswordCodeValidation = undefined;
        await existingUser.save();

        return res.status(200).json({ success: true, message: "Password reset successful. You can now log in." });

    } catch (error) {
        console.error("Password Reset Error:", error);
        res.status(500).json({ success: false, message: "Error resetting password." });
    }
};
