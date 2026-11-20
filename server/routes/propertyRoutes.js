const express = require("express");
const router = express.Router();

const {
  addProperty,
  getProperties,
  getPropertyById,
  getOwnerProperties,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const authMiddleware = require("../middleware/authMiddleware");

// Public browsing of available properties
router.get("/", getProperties);

// Owner properties endpoint (must come before /:id)
router.get("/my-properties", authMiddleware, getOwnerProperties);

// Get single property details
router.get("/:id", getPropertyById);

// Owner adds property
router.post("/", authMiddleware, addProperty);

// Owner updates property
router.put("/:id", authMiddleware, updateProperty);

// Owner/Admin deletes property
router.delete("/:id", authMiddleware, deleteProperty);

module.exports = router;
