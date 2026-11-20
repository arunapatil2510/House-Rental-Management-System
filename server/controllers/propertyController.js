const Property = require("../models/Property");
const Application = require("../models/Application");

// ADD PROPERTY
const addProperty = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only owners can add properties" });
    }

    const property = await Property.create({
      ...req.body,
      owner: req.user.id,
    });

    res.status(201).json({
      message: "Property added successfully",
      property,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL AVAILABLE PROPERTIES (FOR TENANT/PUBLIC BROWSING)
const getProperties = async (req, res) => {
  try {
    const properties = await Property.find({ isAvailable: true })
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE PROPERTY DETAILS
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "owner",
      "name email phone"
    );

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PROPERTIES OF CURRENT OWNER (INCLUDING RENTED ONES)
const getOwnerProperties = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only owners can view their properties" });
    }

    const properties = await Property.find({ owner: req.user.id })
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROPERTY
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      req.user.role !== "admin" &&
      (req.user.role !== "owner" || property.owner.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        message: "You can only edit your own properties",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "location",
      "rent",
      "bedrooms",
      "bathrooms",
      "propertyType",
      "image",
      "isAvailable",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });

    await property.save();

    res.status(200).json({
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PROPERTY
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      req.user.role !== "admin" &&
      (req.user.role !== "owner" || property.owner.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        message: "You can only delete your own properties",
      });
    }

    // Cascade delete any applications associated with this property
    await Application.deleteMany({ property: req.params.id });
    await property.deleteOne();

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addProperty,
  getProperties,
  getPropertyById,
  getOwnerProperties,
  updateProperty,
  deleteProperty,
};
