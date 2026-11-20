const User = require("../models/User");
const Property = require("../models/Property");
const Application = require("../models/Application");

// GET ADMIN DASHBOARD STATISTICS
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      tenants,
      owners,
      admins,
      totalProperties,
      availableProperties,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "tenant" }),
      User.countDocuments({ role: "owner" }),
      User.countDocuments({ role: "admin" }),
      Property.countDocuments(),
      Property.countDocuments({ isAvailable: true }),
      Application.countDocuments(),
      Application.countDocuments({ status: "Pending" }),
      Application.countDocuments({ status: "Accepted" }),
      Application.countDocuments({ status: "Rejected" }),
    ]);

    res.status(200).json({
      totalUsers,
      tenants,
      owners,
      admins,
      totalProperties,
      availableProperties,
      rentedProperties: totalProperties - availableProperties,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: "Admin cannot delete their own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cascade delete user's properties & applications
    if (user.role === "owner") {
      const properties = await Property.find({ owner: id });
      const propertyIds = properties.map((p) => p._id);
      await Application.deleteMany({ property: { $in: propertyIds } });
      await Property.deleteMany({ owner: id });
    } else if (user.role === "tenant") {
      await Application.deleteMany({ tenant: id });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User and related data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PROPERTIES
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PROPERTY (ADMIN)
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Delete associated applications
    await Application.deleteMany({ property: req.params.id });
    await property.deleteOne();

    res.status(200).json({ message: "Property and associated applications deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL APPLICATIONS
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("property")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

