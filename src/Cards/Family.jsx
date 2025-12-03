import React, { useEffect, useState, useRef } from "react";
import { FiArrowLeft, FiSearch, FiFilter, FiPhone, FiHome } from "react-icons/fi";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

const Family = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWing, setFilterWing] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showContact, setShowContact] = useState({});

  // ✅ Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      // Only fetch if user is authenticated
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // ✅ Make sure your Firestore collection name is "users" (plural)
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(usersCollection);

        // ✅ Map docs properly (include document ID)
        const userList = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Fetched users:", userList); // ✅ Debug check
        setUsers(userList);
        setFilteredUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if authentication state is determined
    if (!loadingAuth) {
      fetchUsers();
    }
  }, [user, loadingAuth]);

  const handleFilter = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          `${user.apartment}_${user.wing}`.toLowerCase().includes(term)
      );
    }

    if (filterRole) filtered = filtered.filter((user) => user.role === filterRole);
    if (filterStatus) filtered = filtered.filter((user) => user.status === filterStatus);
    if (filterWing) filtered = filtered.filter((user) => user.wing === filterWing);

    filtered = filtered.sort((a, b) => {
      const fieldA = a[sortBy]?.toString().toLowerCase() || "";
      const fieldB = b[sortBy]?.toString().toLowerCase() || "";
      return sortOrder === "asc"
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    });

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [searchTerm, sortBy, sortOrder, filterRole, filterStatus, filterWing, users]);

  const toggleContact = (idx) => {
    setShowContact((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loadingAuth || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-700 text-xl">Loading users...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-700 text-xl">Please log in to view family members.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto relative mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          ← Back
        </button>
        <h2 className="text-4xl font-bold text-gray-800 text-center">USER LIST</h2>
      </div>

      {/* Search & Filter Controls */}
      <div className="max-w-5xl mx-auto flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or apartment..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg shadow-sm"
        >
          <option value="name">Sort by Name</option>
          <option value="apartment">Sort by Apartment</option>
          <option value="email">Sort by Email</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-4 py-2 border rounded-lg shadow-sm"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>

        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center px-4 py-2 border rounded-lg shadow-sm bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            <FiFilter className="mr-2" />
            Filter
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-10">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="mt-1 block w-full border rounded-lg shadow-sm"
                >
                  <option value="">All</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 block w-full border rounded-lg shadow-sm"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Wing
                </label>
                <select
                  value={filterWing}
                  onChange={(e) => setFilterWing(e.target.value)}
                  className="mt-1 block w-full border rounded-lg shadow-sm"
                >
                  <option value="">All</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <button
                onClick={() => setIsFilterOpen(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="max-w-5xl mx-auto relative">
        <div
          ref={scrollRef}
          className="bg-white shadow-lg rounded-lg overflow-y-auto max-h-[35vw]"
        >
          <div className="divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, idx) => (
                <div
                  key={user.id || idx}
                  className="p-6 hover:bg-gray-100 transition flex justify-between items-center"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-xl font-semibold">
                      {user.name || "Unnamed User"}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FiHome className="text-blue-500" />
                      <span>
                        {user.apartment || "?"}_{user.wing || "-"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleContact(idx)}
                    className="text-blue-500 hover:text-blue-600 transition"
                  >
                    <FiPhone className="text-2xl" />
                  </button>
                  {showContact[idx] && (
                    <div className="ml-4 text-gray-700">
                      <p>Email: {user.email || "N/A"}</p>
                      <p>Phone: {user.phone || "N/A"}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                No users found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Family;
