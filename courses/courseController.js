const Course = require('./courseModel');

// Create a new course draft
exports.createCourse = async (req, res) => {
  try {
    console.log('CreateCourse: received body:', req.body);

    // Create empty or minimal draft, fallback to empty if fields missing
    const newCourse = new Course({
      landingPage: {
        courseTitle: '', // empty string or default
        courseCategory: '',
        courseDescription: '',
        courseThumbnail: '',
        coursePreview:  '',
      },
      coursePlan: {
        learningObjectives:  [],
        courseRequirements:  [],
        courseLevel:  '',
      },
      curriculum: {
        sections: []
      },
      price: {
        currency:  '',
        pricingTier: '',
        amount: 0,
      },
      status: "Draft",  // <-- status is Draft initially
    });

    const savedCourse = await newCourse.save();
    console.log('CreateCourse: course saved as draft:', savedCourse._id);

    res.status(201).json(savedCourse);
  } catch (err) {
    console.error('CreateCourse: error creating course:', err);
    res.status(500).json({ message: 'Error creating course', error: err.message });
  }
};


// Get full course by ID
exports.getCourse = async (req, res) => {
  try {
    console.log('GetCourse: fetching course with ID:', req.params.id);
    const course = await Course.findById(req.params.id);
    if (!course) {
      console.warn('GetCourse: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    console.error('GetCourse: error fetching course:', err);
    res.status(500).json({ message: 'Error fetching course', error: err.message });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    console.log('GetAllCourses: fetching all courses');
    const rawCourses = await Course.find();

    const courses = rawCourses.map(course => ({
      _id: course._id,
      landingPage: course.landingPage,
      coursePlan: course.coursePlan,
      curriculum: course.curriculum,
      price: course.price,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    res.json({ total: courses.length, courses });
  } catch (err) {
    console.error('GetAllCourses: error fetching courses:', err);
    res.status(500).json({ message: 'Failed to fetch courses', error: err.message });
  }
};

// Delete course by ID
exports.deleteCourse = async (req, res) => {
  try {
    console.log('DeleteCourse: deleting course with ID:', req.params.id);
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.warn('DeleteCourse: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('DeleteCourse: error deleting course:', err);
    res.status(500).json({ message: 'Error deleting course', error: err.message });
  }
};

// Landing page getters and setters
exports.getLanding = async (req, res) => {
  try {
    console.log('GetLanding: fetching landing page for course:', req.params.id);
    const course = await Course.findById(req.params.id).select('landingPage');
    if (!course) {
      console.warn('GetLanding: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course.landingPage);
  } catch (err) {
    console.error('GetLanding: error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateLanding = async (req, res) => {
  try {
    console.log('UpdateLanding: updating landing page for course:', req.params.id, 'with data:', req.body);

    const update = {
      landingPage: {
        courseTitle: req.body.courseTitle,
        courseCategory: req.body.courseCategory,
        courseDescription: req.body.courseDescription,
        courseThumbnail: req.body.courseThumbnail,
        coursePreview: req.body.coursePreview,
      }
    };

    const updated = await Course.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!updated) {
      console.warn('UpdateLanding: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(updated.landingPage);
  } catch (err) {
    console.error('UpdateLanding: error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Course plan getters and setters
exports.getPlan = async (req, res) => {
  try {
    console.log('GetPlan: fetching course plan for course:', req.params.id);
    const course = await Course.findById(req.params.id).select('coursePlan');
    if (!course) {
      console.warn('GetPlan: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course.coursePlan);
  } catch (err) {
    console.error('GetPlan: error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    console.log('UpdatePlan: updating course plan for course:', req.params.id, 'with data:', req.body);

    const update = {
      coursePlan: {
        learningObjectives: req.body.learningObjectives,
        courseRequirements: req.body.courseRequirements,
        courseLevel: req.body.courseLevel,
      }
    };

    const updated = await Course.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!updated) {
      console.warn('UpdatePlan: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(updated.coursePlan);
  } catch (err) {
    console.error('UpdatePlan: error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Curriculum getters and setters
exports.getCurriculum = async (req, res) => {
  try {
    console.log('GetCurriculum: fetching curriculum for course:', req.params.id);
    const course = await Course.findById(req.params.id).select('curriculum');
    if (!course) {
      console.warn('GetCurriculum: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course.curriculum);
  } catch (err) {
    console.error('GetCurriculum: error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    console.log('UpdateCurriculum: updating curriculum for course:', req.params.id, 'with data:', req.body);

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { curriculum: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.warn('UpdateCurriculum: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(updated.curriculum);
  } catch (err) {
    console.error('UpdateCurriculum: error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Price getters and setters
exports.getPrice = async (req, res) => {
  try {
    console.log('GetPrice: fetching price for course:', req.params.id);
    const course = await Course.findById(req.params.id).select('price');
    if (!course) {
      console.warn('GetPrice: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course.price);
  } catch (err) {
    console.error('GetPrice: error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updatePrice = async (req, res) => {
  try {
    console.log('UpdatePrice: updating price for course:', req.params.id, 'with data:', req.body);

    const update = {
      price: {
        currency: req.body.currency,
        pricingTier: req.body.pricingTier,
        amount: req.body.amount,
        discountPrice: req.body.discountPrice || null
      }
    };

    const updated = await Course.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!updated) {
      console.warn('UpdatePrice: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(updated.price);
  } catch (err) {
    console.error('UpdatePrice: error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Submit course for review (Draft -> Pending)
exports.submitForReview = async (req, res) => {
  try {
    console.log('SubmitForReview: submitting course for review:', req.params.id);
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status === 'Published') {
      return res.status(400).json({ message: 'Course is already published' });
    }

    if (course.status !== 'Draft') {
      return res.status(400).json({ message: 'Course must be in draft to submit for review' });
    }

    course.status = 'Pending';
    await course.save();

    res.json({ message: 'Course submitted for review', status: course.status });
  } catch (err) {
    console.error('SubmitForReview: error:', err);
    res.status(500).json({ error: err.message });
  }
};


// Publish course (Pending -> Published)
exports. verifyCourse = async (req, res) => {
  try {
    console.log('PublishCourse: publishing course:', req.params.id);
    const course = await Course.findById(req.params.id);

    if (!course) {
      console.warn('PublishCourse: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== 'Pending') {
      return res.status(400).json({ message: 'Course must be pending review to be published' });
    }

    course.status = 'Published';
    await course.save();

    res.json({ message: 'Course published successfully', status: course.status });
  } catch (err) {
    console.error('PublishCourse: error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Archive course (Published -> Archived)
exports.rejectCourse = async (req, res) => {
  try {
    console.log('ArchiveCourse: archiving course:', req.params.id);
    const course = await Course.findById(req.params.id);

    if (!course) {
      console.warn('ArchiveCourse: course not found:', req.params.id);
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== 'Published') {
      return res.status(400).json({ message: 'Only published courses can be archived' });
    }

    course.status = 'Rejected';
    await course.save();

    res.json({ message: 'Course archived successfully', status: course.status });
  } catch (err) {
    console.error('ArchiveCourse: error:', err);
    res.status(500).json({ error: err.message });
  }
};
