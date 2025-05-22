const { changePasswordSchema} = require("../middleware/validator");
const instructor = require('../Authentication/instructorModel');
const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');

exports.changePassword = async (req, res) => {
    const { verified } = req.user;
    const instructorId = req.instructorId;
    const { oldPassword, newPassword } = req.body;

    try {
        const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });
        if (error) {return res.status(400).json({ success: false, message: error.details[0].message });}

        if (!verified) { return res.status(401).json({ success: false, message: "You are not verified as a instructor" });}

        const existingInstructor = await instructor.findOne({ _id: instructorId }).select('+registrationDetails.password');
        if (!existingInstructor) { return res.status(401).json({ success: false, message: 'Invalid credentials' });}


        const saltRounds = 12;
        const salt = await bcrypt.genSalt(saltRounds);  // ✅ Generate a valid salt
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        existingInstructor.registrationDetails.password = hashedPassword;


        await existingInstructor.save();
        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }
    catch (error)
    {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



