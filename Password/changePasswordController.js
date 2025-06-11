const Instructor = require('../Authentication/instructorModel');
const Student = require('../Authentication/studentModel');
const bcrypt = require('bcryptjs');
const { changePasswordSchema } = require('../Middleware/validator'); // Ensure you import your schema

exports.changePassword = async (req, res) => {
    const { verified, role, userId } = req.user;  // Get role (instructor or student) and userId
    const { oldPassword, newPassword } = req.body;

    try {
        const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        if (!verified) {
            return res.status(401).json({ success: false, message: `You are not verified as a ${role}` });
        }

        let userModel = role === 'instructor' ? Instructor : Student;

        const user = await userModel.findById(userId).select('+registrationDetails.password');
        if (!user) {
            return res.status(404).json({ success: false, message: `${role} not found` });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.registrationDetails.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Old password is incorrect' });
        }

        const salt = await bcrypt.genSalt(12);
        user.registrationDetails.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
