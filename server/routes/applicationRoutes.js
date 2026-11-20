const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createApplication,
  getTenantApplications,
  getOwnerApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");

// Tenant submits application
router.post("/", protect, createApplication);

// Tenant views their applications
router.get("/my-applications", protect, getTenantApplications);

// Owner views received applications
router.get("/received", protect, getOwnerApplications);

// Owner/Admin updates application status (Accept / Reject)
router.put("/:id/status", protect, updateApplicationStatus);

module.exports = router;

