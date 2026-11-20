import { useEffect, useState } from "react";
import "./dashboard.css";

const API = "http://localhost:5000/api";

function Dashboard({ user, token, onNavigate, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [tenantApplications, setTenantApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals State
  const [selectedProperty, setSelectedProperty] = useState(null); // Details Modal
  const [applyModalProperty, setApplyModalProperty] = useState(null); // Apply Modal
  const [applyForm, setApplyForm] = useState({
    contactNumber: "",
    moveInDate: "",
    message: "",
  });
  const [applying, setApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState({ error: "", success: "" });

  // Fetch Public Available Properties
  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API}/properties`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setProperties(data);
      }
    } catch (error) {
      console.error("Property loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tenant Applications to know which ones are already applied
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
      console.error("Applications loading error:", error);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (user?.role === "tenant" && token) {
      fetchTenantApplications();
    }
  }, [user, token]);

  const hasAppliedForProperty = (propertyId) => {
    return tenantApplications.some(
      (app) => (app.property?._id || app.property) === propertyId
    );
  };

  // Open Apply Modal
  const handleOpenApplyModal = (property) => {
    if (!user) {
      alert("Please login as a tenant to apply for this rental property.");
      onNavigate("login");
      return;
    }

    if (user.role !== "tenant") {
      alert(`You are logged in as an ${user.role}. Only registered tenants can apply for rent.`);
      return;
    }

    if (hasAppliedForProperty(property._id)) {
      alert("You have already submitted an application for this property.");
      return;
    }

    setApplyModalProperty(property);
    setApplyForm({
      contactNumber: user.phone || "",
      moveInDate: "",
      message: "",
    });
    setApplyFeedback({ error: "", success: "" });
  };

  // Submit Application
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyModalProperty) return;

    if (!applyForm.contactNumber || !applyForm.moveInDate) {
      setApplyFeedback({
        error: "Please provide both contact number and preferred move-in date.",
        success: "",
      });
      return;
    }

    setApplying(true);
    setApplyFeedback({ error: "", success: "" });

    try {
      const response = await fetch(`${API}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: applyModalProperty._id,
          contactNumber: applyForm.contactNumber,
          moveInDate: applyForm.moveInDate,
          message: applyForm.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit application");
      }

      setApplyFeedback({
        error: "",
        success: "Application submitted successfully! Track status in My Applications.",
      });

      await fetchTenantApplications();

      setTimeout(() => {
        setApplyModalProperty(null);
        setSelectedProperty(null);
      }, 1500);
    } catch (error) {
      setApplyFeedback({ error: error.message, success: "" });
    } finally {
      setApplying(false);
    }
  };

  // Filtered Properties for search
  const filteredProperties = properties.filter((p) =>
    `${p.title} ${p.location} ${p.propertyType}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <a className="brand" href="#home">
          RentEase<span>.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#properties">Properties</a>
          <a href="#about">About Us</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <button
                className="login-btn"
                onClick={() => onNavigate(user.role === "admin" ? "admin" : "user")}
              >
                {user.role === "admin" ? "Admin Console" : "Dashboard"}
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </button>
              <button className="signup-btn" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="login-btn" onClick={() => onNavigate("login")}>
                Login
              </button>
              <button className="signup-btn" onClick={() => onNavigate("register")}>
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="hero-content">
          <span className="tag">WELCOME TO RENTEASE</span>

          <h1>
            Find a place you'll <span>love to call home.</span>
          </h1>

          <p>
            Discover beautiful and affordable rental properties. Find your
            perfect home with a simple, transparent application process.
          </p>

          <div className="search-box">
            <input
              placeholder="Search location or property type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              onClick={() =>
                document
                  .getElementById("properties")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Search Homes
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>Easy</strong>
              <small>Property Search</small>
            </div>
            <div>
              <strong>1-Click</strong>
              <small>Rental Applications</small>
            </div>
            <div>
              <strong>Transparent</strong>
              <small>Owner Decisions</small>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="house-icon">⌂</div>
          <div className="visual-caption">
            <span>YOUR DREAM HOME AWAITS</span>
            <strong>Every home has a story.</strong>
          </div>
        </div>
      </section>

      {/* PROPERTIES SECTION */}
      <section className="properties-section" id="properties">
        <div className="section-heading">
          <div>
            <span className="tag">EXPLORE HOMES</span>
            <h2>Available Properties</h2>
            <p>Discover verified rental homes open for rent.</p>
          </div>

          <span className="property-count">
            {filteredProperties.length} Properties Available
          </span>
        </div>

        {loading ? (
          <div className="empty-message">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="empty-message">
            <h3>No properties found</h3>
            <p>Try another search or check back later.</p>
          </div>
        ) : (
          <div className="property-grid">
            {filteredProperties.map((property) => {
              const applied = hasAppliedForProperty(property._id);

              return (
                <div className="property-card" key={property._id}>
                  <div className="property-image">
                    {property.image ? (
                      <img src={property.image} alt={property.title} />
                    ) : (
                      <div className="house-placeholder">⌂</div>
                    )}

                    <span className="available-badge">Available</span>
                  </div>

                  <div className="property-info">
                    <span className="property-type">{property.propertyType}</span>

                    <h3>{property.title}</h3>
                    <p className="location">📍 {property.location}</p>

                    <div className="property-details">
                      <span>🛏 {property.bedrooms} Bedrooms</span>
                      <span>🛁 {property.bathrooms} Bathrooms</span>
                    </div>

                    <div className="property-price">
                      <strong>
                        ₹{Number(property.rent).toLocaleString("en-IN")}
                      </strong>
                      <span> / month</span>
                    </div>

                    {/* CARD ACTIONS: VIEW DETAILS & APPLY */}
                    <div className="property-actions">
                      <button
                        className="btn-details"
                        onClick={() => setSelectedProperty(property)}
                      >
                        View Details
                      </button>

                      {applied ? (
                        <button className="btn-applied" disabled>
                          ✓ Applied
                        </button>
                      ) : (
                        <button
                          className="btn-apply"
                          onClick={() => handleOpenApplyModal(property)}
                        >
                          Apply for Rent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PROPERTY DETAILS MODAL */}
      {selectedProperty && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProperty(null)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedProperty.title}</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedProperty(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-image-preview">
                {selectedProperty.image ? (
                  <img
                    src={selectedProperty.image}
                    alt={selectedProperty.title}
                  />
                ) : (
                  <div className="house-placeholder">⌂</div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div className="property-price">
                  <strong style={{ fontSize: "28px", color: "#172b4d" }}>
                    ₹{Number(selectedProperty.rent).toLocaleString("en-IN")}
                  </strong>
                  <span> / month</span>
                </div>

                <span
                  className={`status-badge ${
                    selectedProperty.isAvailable ? "available" : "rented"
                  }`}
                >
                  {selectedProperty.isAvailable ? "Available for Rent" : "Rented"}
                </span>
              </div>

              <p style={{ margin: "14px 0", color: "#64748b" }}>
                📍 {selectedProperty.location}
              </p>

              <div className="detail-grid">
                <div className="detail-item">
                  <span>Property Type</span>
                  <strong>{selectedProperty.propertyType}</strong>
                </div>
                <div className="detail-item">
                  <span>Bedrooms</span>
                  <strong>{selectedProperty.bedrooms} Bedrooms</strong>
                </div>
                <div className="detail-item">
                  <span>Bathrooms</span>
                  <strong>{selectedProperty.bathrooms} Bathrooms</strong>
                </div>
                <div className="detail-item">
                  <span>Availability</span>
                  <strong>{selectedProperty.isAvailable ? "Immediate" : "Rented"}</strong>
                </div>
              </div>

              <h4 style={{ margin: "20px 0 8px", color: "#172b4d" }}>
                Description & Amenities
              </h4>
              <p style={{ color: "#475569", lineHeight: "1.7", fontSize: "14px" }}>
                {selectedProperty.description}
              </p>

              {selectedProperty.owner && (
                <div className="owner-info-box">
                  <h4>Owner / Landlord Details</h4>
                  <p>
                    <strong>Name:</strong> {selectedProperty.owner.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedProperty.owner.email}
                  </p>
                  {selectedProperty.owner.phone && (
                    <p>
                      <strong>Contact:</strong> {selectedProperty.owner.phone}
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginTop: "25px", display: "flex", gap: "12px" }}>
                {hasAppliedForProperty(selectedProperty._id) ? (
                  <button className="btn-applied" style={{ flex: 1 }} disabled>
                    ✓ You Have Already Applied for This Property
                  </button>
                ) : (
                  <button
                    className="signup-btn"
                    style={{ flex: 1, padding: "14px" }}
                    onClick={() => {
                      handleOpenApplyModal(selectedProperty);
                    }}
                  >
                    Apply for Rent Now
                  </button>
                )}

                <button
                  className="login-btn"
                  onClick={() => setSelectedProperty(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLY FOR RENT MODAL */}
      {applyModalProperty && (
        <div
          className="modal-overlay"
          onClick={() => setApplyModalProperty(null)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="modal-header">
              <h2>Apply for Rent</h2>
              <button
                className="modal-close"
                onClick={() => setApplyModalProperty(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "20px",
                }}
              >
                <strong style={{ fontSize: "16px", color: "#172b4d" }}>
                  {applyModalProperty.title}
                </strong>
                <p style={{ margin: "4px 0", color: "#64748b", fontSize: "13px" }}>
                  📍 {applyModalProperty.location} • ₹
                  {Number(applyModalProperty.rent).toLocaleString("en-IN")} / month
                </p>
              </div>

              <form onSubmit={handleSubmitApplication}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>
                  Your Contact Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={applyForm.contactNumber}
                  onChange={(e) =>
                    setApplyForm({ ...applyForm, contactNumber: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #dce2eb",
                    borderRadius: "7px",
                    marginBottom: "16px",
                  }}
                />

                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>
                  Preferred Move-in Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={applyForm.moveInDate}
                  onChange={(e) =>
                    setApplyForm({ ...applyForm, moveInDate: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #dce2eb",
                    borderRadius: "7px",
                    marginBottom: "16px",
                  }}
                />

                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "#334155" }}>
                  Message to Owner (Optional)
                </label>
                <textarea
                  rows="4"
                  placeholder="Introduce yourself, your profession, duration of stay, or questions..."
                  value={applyForm.message}
                  onChange={(e) =>
                    setApplyForm({ ...applyForm, message: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #dce2eb",
                    borderRadius: "7px",
                    marginBottom: "16px",
                    resize: "vertical",
                  }}
                />

                {applyFeedback.error && (
                  <div
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      marginBottom: "16px",
                      border: "1px solid #fecaca",
                    }}
                  >
                    {applyFeedback.error}
                  </div>
                )}

                {applyFeedback.success && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      color: "#166534",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      marginBottom: "16px",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    {applyFeedback.success}
                  </div>
                )}

                <button
                  type="submit"
                  className="signup-btn"
                  style={{ width: "100%", padding: "14px", fontSize: "14px" }}
                  disabled={applying}
                >
                  {applying ? "Submitting Application..." : "Submit Rental Application"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT SECTION */}
      <section className="about-section" id="about">
        <span className="tag">WHY CHOOSE US?</span>
        <h2>Making house hunting simpler.</h2>

        <p className="about-description">
          RentEase brings property owners and tenants together through one
          convenient, secure rental management platform.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>Find Your Home</h3>
            <p>
              Explore available rental properties in your preferred location with full transparent details.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔑</div>
            <h3>List Your Property</h3>
            <p>
              Owners can easily publish, update and manage rental listings, review tenants, and accept bookings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Manage Applications</h3>
            <p>
              Real-time rental applications workflow with instant updates and transparent status tracking.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <a href="#home" className="brand footer-brand">
          RentEase<span>.</span>
        </a>
        <p>Making rental living easier, one home at a time.</p>
        <small>© 2026 RentEase. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default Dashboard;
