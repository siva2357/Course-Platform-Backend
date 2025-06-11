
const instructor = require('../Authentication/instructorModel');
const student = require('../Authentication/studentModel'); // ✅ import student model
const transport = require("../Middleware/sendMail");
const { hmacProcess } = require("../utils/hashing");
const { acceptCodeSchema } = require('../Middleware/validator');

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
        let user = await instructor.findOne({ 'registrationDetails.email': email });
        let role = 'Instructor';

        if (!user) {
            user = await student.findOne({ 'registrationDetails.email': email });
            role = 'Student';
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email does not exist!" });
        }

        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: "Verification Code for Account Verification",
            html: `<h1>Your OTP for account verification: ${codeValue}</h1>`
        });

        if (info.accepted[0] === email) {
            user.registrationDetails.verificationCode = hashedCodeValue;
            user.registrationDetails.verificationCodeValidation = Date.now();
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: `OTP has been sent to ${email}. Please check your inbox.`,
            role
        });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while sending the OTP." });
    }
};

exports.verifyCode = async (req, res) => {
    const { error } = acceptCodeSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, providedCode } = req.body;

    try {
        let user = await instructor.findOne({ 'registrationDetails.email': email })
            .select("+registrationDetails.verificationCode +registrationDetails.verificationCodeValidation");
        let role = 'Instructor';

        if (!user) {
            user = await student.findOne({ 'registrationDetails.email': email })
                .select("+registrationDetails.verificationCode +registrationDetails.verificationCodeValidation");
            role = 'Student';
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email does not exist!" });
        }

        if (!user.registrationDetails.verificationCode || !user.registrationDetails.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: "No verification code found!" });
        }

        if (Date.now() - user.registrationDetails.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Verification code has expired!" });
        }

        const hashedCodeValue = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue === user.registrationDetails.verificationCode) {
            user.registrationDetails.verified = true;
            user.registrationDetails.verificationCode = undefined;
            user.registrationDetails.verificationCodeValidation = undefined;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "User account has been verified successfully.",
                role
            });
        }

        return res.status(400).json({ success: false, message: "Invalid verification code!" });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during code verification." });
    }
};
