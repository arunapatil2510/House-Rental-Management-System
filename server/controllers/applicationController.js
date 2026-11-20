const Application = require("../models/Application");
const Property = require("../models/Property");

// CREATE RENTAL APPLICATION (TENANT)
exports.createApplication = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({ message: "Only tenants can apply for rental properties" });
    }

    const { propertyId, contactNumber, moveInDate, message } = req.body;

    if (!propertyId || !contactNumber || !moveInDate) {
      return res.status(400).json({
        message: "Please provide property ID, contact number, and preferred move-in date",
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (!property.isAvailable) {
      return res.status(400).json({
        message: "This property is currently not available for rent",
      });
    }

    if (property.owner.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot apply to your own property",
      });
    }

    // Check if tenant has already applied for this property
    const existingApplication = await Application.findOne({
      property: propertyId,
      tenant: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already submitted an application for this property",
      });
    }

    const application = await Application.create({
      property: propertyId,
      tenant: req.user.id,
      owner: property.owner,
      contactNumber,
      moveInDate,
      message: message || "",
      status: "Pending",
    });

    const populatedApp = await Application.findById(application._id)
      .populate("property")
      .populate("owner", "name email phone");

    res.status(201).json({
      message: "Application submitted successfully",
      application: populatedApp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET TENANT'S OWN APPLICATIONS
exports.getTenantApplications = async (req, res) => {
  try {
    const applications = await Application.find({ tenant: req.user.id })
      .populate("property")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET OWNER'S RECEIVED APPLICATIONS
exports.getOwnerApplications = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only property owners can access received applications" });
    }

    const applications = await Application.find({ owner: req.user.id })
      .populate("property")
      .populate("tenant", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE APPLICATION STATUS (ACCEPT / REJECT)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Status must be 'Accepted' or 'Rejected'",
      });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify permission: only the property owner or an admin can accept/reject
    if (
      req.user.role !== "admin" &&
      application.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You are not authorized to update this application",
      });
    }

    application.status = status;
    await application.save();

    // When accepted, mark the property as unavailable
    if (status === "Accepted") {
      await Property.findByIdAndUpdate(application.property, {
        isAvailable: false,
      });
    }

    const updatedApp = await Application.findById(id)
      .populate("property")
      .populate("tenant", "name email phone")
      .populate("owner", "name email phone");

    res.status(200).json({
      message: `Application marked as ${status}`,
      application: updatedApp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

