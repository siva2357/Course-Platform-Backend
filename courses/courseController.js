const Course = require('./courseModel');

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const newCourse = new Course(req.body);  // Using request body to create a course
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);  // Respond with the saved course
  } catch (err) {
    res.status(500).json({ message: "Error creating course", error: err });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();  // Retrieve all courses from the database
    res.status(200).json(courses);  // Respond with the list of courses
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses", error: err });
  }
};

// Get a single course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);  // Find course by ID
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);  // Respond with the course
  } catch (err) {
    res.status(500).json({ message: "Error fetching course", error: err });
  }
};

// Update a course by ID
exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Find by ID and update
    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(updatedCourse);  // Respond with the updated course
  } catch (err) {
    res.status(500).json({ message: "Error updating course", error: err });
  }
};

// Delete a course by ID
exports.deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);  // Find by ID and delete
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting course", error: err });
  }
};





// Verify a course (change status to Published)
exports.verifyCourse = async (req, res) => {
    try {
      const courseId = req.params.id;
      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { status: "Published" },
        { new: true }
      );
  
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      res.status(200).json({ message: "Course verified", course: updatedCourse });
    } catch (err) {
      res.status(500).json({ message: "Error verifying course", error: err });
    }
  };
  
  // Reject a course (change status to Rejected)
  exports.rejectCourse = async (req, res) => {
    try {
      const courseId = req.params.id;
      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { status: "Rejected" },
        { new: true }
      );
  
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      res.status(200).json({ message: "Course rejected", course: updatedCourse });
    } catch (err) {
      res.status(500).json({ message: "Error rejecting course", error: err });
    }
  };