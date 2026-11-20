const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getStats,
  getAllUsers,
  deleteUser,
  getAllProperties,
  deleteProperty,
  getAllApplications,
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/properties", getAllProperties);
router.delete("/properties/:id", deleteProperty);
router.get("/applications", getAllApplications);

module.exports = router;

