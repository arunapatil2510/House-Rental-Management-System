import { useEffect, useState } from "react";
import "./user.css";

const API = "http://localhost:5000/api";

function UserDashboard({ user, token, onNavigate, onLogout }) {
  // Owner States
  const [ownerProperties, setOwnerProperties] = useState([]);
  const [ownerApplications, setOwnerApplications] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [ownerTab, setOwnerTab] = useState("applications"); // "applications" | "properties" | "add"

  const [propertyForm, setPropertyForm] = useState({
    title: "",
    description: "",
    location: "",
    rent: "",
    bedrooms: "",
    bathrooms: "",
    propertyType: "Apartment",
    image: "",
  });
  const [addingProperty, setAddingProperty] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [propertyMessage, setPropertyMessage] = useState("");

  // Tenant States
  const [tenantApplications, setTenantApplications] = useState([]);
  const [tenantTab, setTenantTab] = useState("applications"); // "applications" | "profile"

  // Fetch Owner Data
  const fetchOwnerProperties = async () => {
    if (!token || (user?.role !== "owner" && user?.role !== "admin")) return;
    try {
      const response = await fetch(`${API}/properties/my-properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOwnerProperties(data);
      }
    } catch (error) {
      console.error("Owner properties error:", error);
    }
  };

  const fetchOwnerApplications = async () => {
    if (!token || (user?.role !== "owner" && user?.role !== "admin")) return;
    try {
      const response = await fetch(`${API}/applications/received`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOwnerApplications(data);
      }
    } catch (error) {
      console.error("Owner applications error:", error);
    }
  };

  // Fetch Tenant Data
  const fetchTenantApplications = async () => {
    if (!token || user?.role !== "tenant") return;
    try {
      const response = await fetch(`${API}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTenantApplications(data);
      }
    } catch (error) {
      console.error("Tenant applications error:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      onNavigate("login");
      return;
    }
    if (user.role === "admin") {
      onNavigate("admin");
      return;
    }
    if (user.role === "owner") {
      fetchOwnerProperties();
      fetchOwnerApplications();
    } else if (user.role === "tenant") {
      fetchTenantApplications();
    }
  }, [user, token]);

  const updatePropertyForm = (e) => {
    setPropertyForm({
      ...propertyForm,
      [e.target.name]: e.target.value,
    });
  };

  // OWNER: ACCEPT / REJECT APPLICATION
  const handleUpdateApplicationStatus = async (applicationId, status) => {
    const actionText = status === "Accepted" ? "accept" : "reject";
    const confirmed = window.confirm(
      status === "Accepted"
        ? "Accept this rental application? This will mark the property as rented and unavailable for others."
        : "Are you sure you want to reject this application?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/applications/${applicationId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Unable to ${actionText} application`);
      }

      alert(`Application has been ${status.toLowerCase()} successfully!`);

      await fetchOwnerApplications();
      await fetchOwnerProperties();
    } catch (error) {
      alert(error.message);
    }
  };

  // ADD PROPERTY
  const handleAddProperty = async (e) => {
    e.preventDefault();

    if (!token) {
      setPropertyMessage("Please login again.");
      return;
    }

    setAddingProperty(true);
    setPropertyMessage("Adding property...");

    try {
      const response = await fetch(`${API}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...propertyForm,
          rent: Number(propertyForm.rent),
          bedrooms: Number(propertyForm.bedrooms),
          bathrooms: Number(propertyForm.bathrooms),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add property");
      }

      await fetchOwnerProperties();

      setPropertyForm({
        title: "",
        description: "",
        location: "",
        rent: "",
        bedrooms: "",
        bathrooms: "",
        propertyType: "Apartment",
        image: "",
      });

      setPropertyMessage("Property added successfully!");
      setOwnerTab("properties");
    } catch (error) {
      setPropertyMessage(error.message);
    } finally {
      setAddingProperty(false);
    }
  };

  // START EDITING PROPERTY
  const handleEditClick = (property) => {
    setEditingPropertyId(property._id);
    setPropertyForm({
      title: property.title || "",
      description: property.description || "",
      location: property.location || "",
      rent: property.rent ?? "",
      bedrooms: property.bedrooms ?? "",
      bathrooms: property.bathrooms ?? "",
      propertyType: property.propertyType || "Apartment",
      image: property.image || "",
    });
    setOwnerTab("add");
    setPropertyMessage("Editing property. Update the details and save.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // CANCEL EDITING
  const handleCancelEdit = () => {
    setEditingPropertyId(null);
    setPropertyForm({
      title: "",
      description: "",
      location: "",
      rent: "",
      bedrooms: "",
      bathrooms: "",
      propertyType: "Apartment",
      image: "",
    });
    setPropertyMessage("");
  };

  // UPDATE PROPERTY
  const handleUpdateProperty = async (e) => {
    e.preventDefault();

    if (!token || !editingPropertyId) {
      setPropertyMessage("Please login again and try.");
      return;
    }

    setAddingProperty(true);
    setPropertyMessage("Updating property...");

    try {
      const response = await fetch(`${API}/properties/${editingPropertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...propertyForm,
          rent: Number(propertyForm.rent),
          bedrooms: Number(propertyForm.bedrooms),
          bathrooms: Number(propertyForm.bathrooms),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update property");
      }

      await fetchOwnerProperties();
      setEditingPropertyId(null);
      setPropertyForm({
        title: "",
        description: "",
        location: "",
        rent: "",
        bedrooms: "",
        bathrooms: "",
        propertyType: "Apartment",
        image: "",
      });
      setPropertyMessage("Property updated successfully!");
      setOwnerTab("properties");
    } catch (error) {
      setPropertyMessage(error.message || "Update failed");
    } finally {
      setAddingProperty(false);
    }
  };

  // DELETE PROPERTY
  const handleDeleteProperty = async (propertyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property? This will also remove any related applications."
    );
    if (!confirmed) return;

    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API}/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete property");
      }

      if (editingPropertyId === propertyId) {
        handleCancelEdit();
      }

      await fetchOwnerProperties();
      alert("Property deleted successfully!");
    } catch (error) {
      alert(error.message || "Delete failed");
    }
  };

  if (!user) return null;

  const pendingReceivedCount = ownerApplications.filter(
    (a) => a.status === "Pending"
  ).length;

  const filteredOwnerApplications = ownerApplications.filter((app) => {
    if (ownerFilter === "All") return true;
    return app.status === ownerFilter;
  });

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("home");
            }}
          >
            RentEase<span>.</span>
          </a>
          <span className={`role-badge ${user.role}`}>{user.role}</span>
        </div>

        <div className="nav-actions">
          <button className="login-btn" onClick={() => onNavigate("home")}>
            Browse Homes
          </button>
          <button className="signup-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <span className="tag">YOUR ACCOUNT</span>
        <h1>Welcome, {user.name}!</h1>
        <p>
          You are logged in as a <strong>{user.role}</strong> ({user.email}).
        </p>

        {/* ============================================================= */}
        {/* OWNER DASHBOARD VIEW                                           */}
        {/* ============================================================= */}
        {user.role === "owner" ? (
          <>
            {/* OWNER TABS */}
            <div className="tabs-nav">
              <button
                className={`tab-btn ${ownerTab === "applications" ? "active" : ""}`}
                onClick={() => setOwnerTab("applications")}
              >
                📥 Received Applications
                {pendingReceivedCount > 0 && (
                  <span
                    className="tab-count"
                    style={{ background: "#fef3c7", color: "#b45309" }}
                  >
                    {pendingReceivedCount} Pending
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${ownerTab === "properties" ? "active" : ""}`}
                onClick={() => setOwnerTab("properties")}
              >
                🏡 My Properties
                <span className="tab-count">{ownerProperties.length}</span>
              </button>
              <button
                className={`tab-btn ${ownerTab === "add" ? "active" : ""}`}
                onClick={() => {
                  setOwnerTab("add");
                  if (!editingPropertyId) {
                    setPropertyMessage("");
                  }
                }}
              >
                {editingPropertyId ? "✏️ Edit Property" : "➕ List New Property"}
              </button>
            </div>

            {/* TAB: RECEIVED APPLICATIONS */}
            {ownerTab === "applications" && (
              <div className="dashboard-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <h2>Received Rental Applications</h2>
                    <p>
                      Review tenant rental requests. Accept an application to approve the tenant and mark the property as rented.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    {["All", "Pending", "Accepted", "Rejected"].map((status) => (
                      <button
                        key={status}
                        className={`tab-btn ${ownerFilter === status ? "active" : ""}`}
                        style={{ padding: "6px 14px", fontSize: "12px" }}
                        onClick={() => setOwnerFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOwnerApplications.length === 0 ? (
                  <div className="empty-message">
                    <h3>No applications found</h3>
                    <p>
                      {ownerFilter === "All"
                        ? "You haven't received any applications for your properties yet."
                        : `No applications with status "${ownerFilter}".`}
                    </p>
                  </div>
                ) : (
                  <div className="applications-list">
                    {filteredOwnerApplications.map((app) => (
                      <div className="application-card" key={app._id}>
                        <div className="application-main">
                          <div className="application-header">
                            <h3>{app.property?.title || "Property"}</h3>
                            <span className={`status-badge ${app.status.toLowerCase()}`}>
                              {app.status}
                            </span>
                          </div>

                          <p style={{ margin: "4px 0", color: "#64748b", fontSize: "13px" }}>
                            📍 {app.property?.location} • ₹
                            {Number(app.property?.rent || 0).toLocaleString("en-IN")} / month
                          </p>

                          <div className="application-meta">
                            <span>
                              👤 <strong>Tenant:</strong> {app.tenant?.name || "Applicant"}
                            </span>
                            <span>
                              ✉️ <strong>Email:</strong> {app.tenant?.email}
                            </span>
                            <span>
                              📞 <strong>Phone:</strong> {app.contactNumber}
                            </span>
                            <span>
                              📅 <strong>Move-in Date:</strong>{" "}
                              {app.moveInDate
                                ? new Date(app.moveInDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </div>

                          {app.message && (
                            <div className="application-message">
                              <strong>Message from Tenant:</strong> "{app.message}"
                            </div>
                          )}

                          <div style={{ marginTop: "10px", fontSize: "11px", color: "#8290a3" }}>
                            Submitted on{" "}
                            {new Date(app.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        {app.status === "Pending" && (
                          <div className="application-actions">
                            <button
                              className="btn-accept"
                              onClick={() => handleUpdateApplicationStatus(app._id, "Accepted")}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleUpdateApplicationStatus(app._id, "Rejected")}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MY PROPERTIES */}
            {ownerTab === "properties" && (
              <div className="dashboard-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <h2>My Listed Properties</h2>
                    <p>View, edit, or delete your properties.</p>
                  </div>

                    <button
                    className="signup-btn"
                    onClick={() => {
                      handleCancelEdit();
                      setOwnerTab("add");
                    }}
                  >
                    + Add New Listing
                  </button>
                </div>

                {ownerProperties.length === 0 ? (
                  <div className="empty-message">
                    <h3>No properties listed yet</h3>
                    <p>Start renting out your homes by adding your first listing.</p>
                    <button
                      className="signup-btn"
                      style={{ marginTop: "15px" }}
                      onClick={() => setOwnerTab("add")}
                    >
                      + Add Property
                    </button>
                  </div>
                ) : (
                  <div className="owner-listings">
                    {ownerProperties.map((property) => (
                      <div className="owner-listing" key={property._id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            gap: "8px",
                          }}
                        >
                          <h3>{property.title}</h3>
                          <span
                            className={`status-badge ${
                              property.isAvailable ? "available" : "rented"
                            }`}
                          >
                            {property.isAvailable ? "Available" : "Rented"}
                          </span>
                        </div>

                        <p style={{ margin: "8px 0" }}>📍 {property.location}</p>
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                          {property.propertyType} • {property.bedrooms} Beds •{" "}
                          {property.bathrooms} Baths
                        </p>

                        <strong style={{ display: "block", marginTop: "10px" }}>
                          ₹{Number(property.rent).toLocaleString("en-IN")} / month
                        </strong>

                        <div className="owner-property-actions">
                          <button
                            type="button"
                            className="login-btn"
                            onClick={() => handleEditClick(property)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="signup-btn"
                            onClick={() => handleDeleteProperty(property._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ADD / EDIT PROPERTY FORM */}
            {ownerTab === "add" && (
              <div className="dashboard-card owner-form-card">
                <h2>{editingPropertyId ? "Edit Property Listing" : "+ Add New Property"}</h2>
                <p>
                  {editingPropertyId
                    ? "Update the details of your rental property below."
                    : "Fill in the specifications to list your property for rent."}
                </p>

                <form
                  className="property-form"
                  onSubmit={editingPropertyId ? handleUpdateProperty : handleAddProperty}
                >
                  <label>Property Title</label>
                  <input
                    name="title"
                    value={propertyForm.title}
                    onChange={updatePropertyForm}
                    placeholder="Example: Modern 2BHK Apartment in Downtown"
                    required
                  />

                  <label>Description</label>
                  <textarea
                    name="description"
                    value={propertyForm.description}
                    onChange={updatePropertyForm}
                    placeholder="Describe amenities, furnishing, neighborhood, rules..."
                    required
                  />

                  <label>Location</label>
                  <input
                    name="location"
                    value={propertyForm.location}
                    onChange={updatePropertyForm}
                    placeholder="Example: Indiranagar, Bangalore"
                    required
                  />

                  <label>Monthly Rent (₹)</label>
                  <input
                    type="number"
                    name="rent"
                    value={propertyForm.rent}
                    onChange={updatePropertyForm}
                    placeholder="25000"
                    min="1"
                    required
                  />

                  <div className="property-form-row">
                    <div>
                      <label>Bedrooms</label>
                      <input
                        type="number"
                        name="bedrooms"
                        value={propertyForm.bedrooms}
                        onChange={updatePropertyForm}
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label>Bathrooms</label>
                      <input
                        type="number"
                        name="bathrooms"
                        value={propertyForm.bathrooms}
                        onChange={updatePropertyForm}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <label>Property Type</label>
                  <select
                    name="propertyType"
                    value={propertyForm.propertyType}
                    onChange={updatePropertyForm}
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="PG">PG</option>
                  </select>

                  <label>Image URL (optional)</label>
                  <input
                    name="image"
                    value={propertyForm.image}
                    onChange={updatePropertyForm}
                    placeholder="https://images.unsplash.com/..."
                  />

                  {propertyMessage && (
                    <p className="property-message">{propertyMessage}</p>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button
                      type="submit"
                      className="signup-btn"
                      disabled={addingProperty}
                    >
                      {addingProperty
                        ? editingPropertyId
                          ? "Saving..."
                          : "Adding..."
                        : editingPropertyId
                        ? "Save Changes"
                        : "Publish Property"}
                    </button>
                    {editingPropertyId && (
                      <button
                        type="button"
                        className="login-btn"
                        onClick={() => {
                          handleCancelEdit();
                          setOwnerTab("properties");
                        }}
                        disabled={addingProperty}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          /* =========================================================== */
          /* TENANT DASHBOARD VIEW                                       */
          /* =========================================================== */
          <>
            <div className="tabs-nav">
              <button
                className={`tab-btn ${tenantTab === "applications" ? "active" : ""}`}
                onClick={() => setTenantTab("applications")}
              >
                📋 My Rental Applications
                <span className="tab-count">{tenantApplications.length}</span>
              </button>
              <button
                className={`tab-btn ${tenantTab === "profile" ? "active" : ""}`}
                onClick={() => setTenantTab("profile")}
              >
                👤 Account Information
              </button>
            </div>

            {tenantTab === "applications" && (
              <div className="dashboard-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <h2>My Applications</h2>
                    <p>Track the progress and status of your rental applications.</p>
                  </div>

                  <button className="signup-btn" onClick={() => onNavigate("home")}>
                    Explore More Homes
                  </button>
                </div>

                {tenantApplications.length === 0 ? (
                  <div className="empty-message">
                    <h3>No rental applications yet</h3>
                    <p>You haven't applied for any rental properties yet.</p>
                    <button
                      className="signup-btn"
                      style={{ marginTop: "15px" }}
                      onClick={() => onNavigate("home")}
                    >
                      Browse Available Properties
                    </button>
                  </div>
                ) : (
                  <div className="applications-list">
                    {tenantApplications.map((app) => (
                      <div className="application-card" key={app._id}>
                        <div className="application-main">
                          <div className="application-header">
                            <h3>{app.property?.title || "Rental Property"}</h3>
                            <span className={`status-badge ${app.status.toLowerCase()}`}>
                              {app.status === "Pending" && "⏳ Pending"}
                              {app.status === "Accepted" && "✓ Accepted"}
                              {app.status === "Rejected" && "✕ Rejected"}
                            </span>
                          </div>

                          <p style={{ margin: "4px 0", color: "#64748b", fontSize: "13px" }}>
                            📍 {app.property?.location} • ₹
                            {Number(app.property?.rent || 0).toLocaleString("en-IN")} / month
                          </p>

                          <div className="application-meta">
                            <span>
                              🔑 <strong>Owner:</strong> {app.owner?.name || "Landlord"}
                            </span>
                            <span>
                              ✉️ <strong>Owner Email:</strong> {app.owner?.email || "—"}
                            </span>
                            <span>
                              📞 <strong>Your Contact:</strong> {app.contactNumber}
                            </span>
                            <span>
                              📅 <strong>Move-in Date:</strong>{" "}
                              {app.moveInDate
                                ? new Date(app.moveInDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </div>

                          {app.message && (
                            <div className="application-message">
                              <strong>Your Message:</strong> "{app.message}"
                            </div>
                          )}

                          {app.status === "Accepted" && (
                            <div
                              style={{
                                marginTop: "12px",
                                padding: "10px 14px",
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "6px",
                                color: "#166534",
                                fontSize: "13px",
                              }}
                            >
                              🎉 Congratulations! The property owner accepted your application. You may connect with the owner at <strong>{app.owner?.email}</strong>.
                            </div>
                          )}

                          {app.status === "Rejected" && (
                            <div
                              style={{
                                marginTop: "12px",
                                padding: "10px 14px",
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                color: "#991b1b",
                                fontSize: "13px",
                              }}
                            >
                              This application was not approved by the owner. Feel free to explore and apply for other listings.
                            </div>
                          )}

                          <div style={{ marginTop: "10px", fontSize: "11px", color: "#8290a3" }}>
                            Applied on{" "}
                            {new Date(app.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tenantTab === "profile" && (
              <div className="dashboard-card">
                <h2>Tenant Profile</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Full Name</span>
                    <strong>{user.name}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Email Address</span>
                    <strong>{user.email}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Registered Role</span>
                    <strong>{user.role}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Primary Contact</span>
                    <strong>{user.phone || "Not specified"}</strong>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
