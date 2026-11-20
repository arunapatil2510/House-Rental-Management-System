import { useEffect, useState } from "react";
import "./admin.css";

const API = "http://localhost:5000/api";

function AdminDashboard({ user, token, onNavigate, onLogout }) {
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminProperties, setAdminProperties] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [adminTab, setAdminTab] = useState("stats"); // "stats" | "users" | "properties" | "applications"
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [adminPropertySearch, setAdminPropertySearch] = useState("");
  const [adminAppFilter, setAdminAppFilter] = useState("All");

  const fetchAdminData = async () => {
    if (!token || user?.role !== "admin") return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, usersRes, propsRes, appsRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/users`, { headers }),
        fetch(`${API}/admin/properties`, { headers }),
        fetch(`${API}/admin/applications`, { headers }),
      ]);

      if (statsRes.ok) setAdminStats(await statsRes.json());
      if (usersRes.ok) setAdminUsers(await usersRes.json());
      if (propsRes.ok) setAdminProperties(await propsRes.json());
      if (appsRes.ok) setAdminApplications(await appsRes.json());
    } catch (error) {
      console.error("Admin data loading error:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      onNavigate("login");
      return;
    }
    if (user.role !== "admin") {
      alert("Access denied: You must be an administrator to view this page.");
      onNavigate("user");
      return;
    }
    fetchAdminData();
  }, [user, token]);

  // DELETE USER
  const handleDeleteUser = async (userId) => {
    if (userId === user.id || userId === user._id) {
      alert("Admin cannot delete their own account.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this user? All their listed properties and rental applications will be permanently deleted."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      alert("User deleted successfully!");
      await fetchAdminData();
    } catch (error) {
      alert(error.message);
    }
  };

  // DELETE PROPERTY
  const handleDeleteProperty = async (propertyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property listing? This will also remove any related applications."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API}/admin/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete property");
      }

      alert("Property deleted successfully!");
      await fetchAdminData();
    } catch (error) {
      alert(error.message);
    }
  };

  if (!user || user.role !== "admin") return null;

  // Filtered views
  const filteredAdminUsers = adminUsers.filter((u) =>
    `${u.name} ${u.email} ${u.role}`
      .toLowerCase()
      .includes(adminUserSearch.toLowerCase())
  );

  const filteredAdminProperties = adminProperties.filter((p) =>
    `${p.title} ${p.location} ${p.owner?.name || ""}`
      .toLowerCase()
      .includes(adminPropertySearch.toLowerCase())
  );

  const filteredAdminApplications = adminApplications.filter((app) => {
    if (adminAppFilter === "All") return true;
    return app.status === adminAppFilter;
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
          <span className="role-badge admin">Admin Portal</span>
        </div>

        <div className="nav-actions">
          <button className="login-btn" onClick={() => onNavigate("home")}>
            View Live Website
          </button>
          <button className="signup-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <span className="tag">SYSTEM ADMINISTRATION</span>
        <h1>Admin Management Console</h1>
        <p>
          Monitor real-time rental activities, manage registered users, oversee listings, and review applications.
        </p>

        {/* ADMIN STATS CARDS */}
        {adminStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.totalUsers}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon emerald">🧑‍💼</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.tenants}</span>
                <span className="stat-label">Tenants</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">🔑</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.owners}</span>
                <span className="stat-label">Property Owners</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">🏠</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.totalProperties}</span>
                <span className="stat-label">Total Properties</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon indigo">📋</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.totalApplications}</span>
                <span className="stat-label">Total Applications</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">⏳</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.pendingApplications}</span>
                <span className="stat-label">Pending Applications</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon emerald">✅</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.acceptedApplications}</span>
                <span className="stat-label">Accepted Applications</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rose">❌</div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.rejectedApplications}</span>
                <span className="stat-label">Rejected Applications</span>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN TABS NAVIGATION */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${adminTab === "stats" ? "active" : ""}`}
            onClick={() => setAdminTab("stats")}
          >
            📊 System Overview
          </button>
          <button
            className={`tab-btn ${adminTab === "users" ? "active" : ""}`}
            onClick={() => setAdminTab("users")}
          >
            👥 Users Management
            <span className="tab-count">{adminUsers.length}</span>
          </button>
          <button
            className={`tab-btn ${adminTab === "properties" ? "active" : ""}`}
            onClick={() => setAdminTab("properties")}
          >
            🏡 All Properties
            <span className="tab-count">{adminProperties.length}</span>
          </button>
          <button
            className={`tab-btn ${adminTab === "applications" ? "active" : ""}`}
            onClick={() => setAdminTab("applications")}
          >
            📑 Rental Applications Monitor
            <span className="tab-count">{adminApplications.length}</span>
          </button>
        </div>

        {/* TAB 1: SYSTEM OVERVIEW */}
        {adminTab === "stats" && (
          <div className="dashboard-card">
            <h2>Rental Ecosystem Health</h2>
            <p>Current operational breakdown across properties and rental workflows:</p>

            <div className="detail-grid" style={{ marginTop: "20px" }}>
              <div className="detail-item">
                <span>Available Listings</span>
                <strong>{adminStats?.availableProperties ?? 0} Properties Open for Rent</strong>
              </div>
              <div className="detail-item">
                <span>Rented / Occupied Listings</span>
                <strong>{adminStats?.rentedProperties ?? 0} Properties Leased</strong>
              </div>
              <div className="detail-item">
                <span>Pending Tenant Reviews</span>
                <strong>{adminStats?.pendingApplications ?? 0} Applications Awaiting Decision</strong>
              </div>
              <div className="detail-item">
                <span>Approved Leases</span>
                <strong>{adminStats?.acceptedApplications ?? 0} Completed Approvals</strong>
              </div>
            </div>

            <div style={{ marginTop: "25px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button className="signup-btn" onClick={() => setAdminTab("applications")}>
                Review All Applications →
              </button>
              <button className="login-btn" onClick={() => setAdminTab("users")}>
                Manage Registered Users →
              </button>
              <button className="login-btn" onClick={() => setAdminTab("properties")}>
                Inspect Listings →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {adminTab === "users" && (
          <div className="table-container">
            <div className="table-toolbar">
              <h3>Registered Users ({filteredAdminUsers.length})</h3>
              <input
                type="text"
                placeholder="Search user name, email, or role..."
                className="table-search"
                value={adminUserSearch}
                onChange={(e) => setAdminUserSearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Registered On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                        No users matched your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminUsers.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <strong>{u.name}</strong>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || "—"}</td>
                        <td>
                          <span className={`role-badge ${u.role}`}>{u.role}</span>
                        </td>
                        <td>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td>
                          {u._id === user.id || u._id === user._id ? (
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              (Current Admin)
                            </span>
                          ) : (
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteUser(u._id)}
                            >
                              Delete User
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ALL PROPERTIES */}
        {adminTab === "properties" && (
          <div className="table-container">
            <div className="table-toolbar">
              <h3>Properties Listed ({filteredAdminProperties.length})</h3>
              <input
                type="text"
                placeholder="Search title, location, or owner..."
                className="table-search"
                value={adminPropertySearch}
                onChange={(e) => setAdminPropertySearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property Title</th>
                    <th>Location</th>
                    <th>Monthly Rent</th>
                    <th>Type / Beds</th>
                    <th>Owner Info</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminProperties.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                        No properties found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminProperties.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <strong>{p.title}</strong>
                        </td>
                        <td>📍 {p.location}</td>
                        <td>₹{Number(p.rent).toLocaleString("en-IN")} / mo</td>
                        <td>
                          {p.propertyType} • {p.bedrooms}B / {p.bathrooms}B
                        </td>
                        <td>
                          {p.owner ? (
                            <div>
                              <div>{p.owner.name}</div>
                              <small style={{ color: "#64748b" }}>{p.owner.email}</small>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              p.isAvailable ? "available" : "rented"
                            }`}
                          >
                            {p.isAvailable ? "Available" : "Rented / Closed"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteProperty(p._id)}
                          >
                            Delete Listing
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RENTAL APPLICATIONS MONITOR */}
        {adminTab === "applications" && (
          <div className="table-container">
            <div className="table-toolbar">
              <div>
                <h3>Rental Applications Monitor ({filteredAdminApplications.length})</h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
                  Full audit trail of rental requests and status transitions
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {["All", "Pending", "Accepted", "Rejected"].map((status) => (
                  <button
                    key={status}
                    className={`tab-btn ${adminAppFilter === status ? "active" : ""}`}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => setAdminAppFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Applicant (Tenant)</th>
                    <th>Owner</th>
                    <th>Move-in Date</th>
                    <th>Contact No.</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminApplications.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                        No applications found for selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminApplications.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <strong>{app.property?.title || "Property Listing"}</strong>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            📍 {app.property?.location || "—"}
                          </div>
                        </td>
                        <td>
                          <div>{app.tenant?.name || "Tenant"}</div>
                          <small style={{ color: "#64748b" }}>{app.tenant?.email}</small>
                        </td>
                        <td>
                          <div>{app.owner?.name || "Owner"}</div>
                          <small style={{ color: "#64748b" }}>{app.owner?.email}</small>
                        </td>
                        <td>
                          {app.moveInDate
                            ? new Date(app.moveInDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td>{app.contactNumber}</td>
                        <td>
                          <span className={`status-badge ${app.status.toLowerCase()}`}>
                            {app.status}
                          </span>
                        </td>
                        <td>
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
