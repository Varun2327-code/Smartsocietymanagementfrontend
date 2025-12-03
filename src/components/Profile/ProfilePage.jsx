import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { auth } from "../../firebase";
import { useFirestore, useCollection } from "../../hooks/useFirestore";
import LoadingSpinner from "../LoadingSpinner";
import {
  User,
  Mail,
  Phone,
  Home,
  Users,
  Car,
  Edit,
  Activity,
  ArrowLeft,
  QrCode,
  Download,
  Shield,
  PhoneCall,
} from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { userProfile, loading: profileLoading, error: profileError } = useFirestore();

  // Firestore queries
  const visitorsQuery = useMemo(
    () => (colRef) => user && query(colRef, where("submittedBy", "==", user.uid)),
    [user]
  );
  const complaintsQuery = useMemo(
    () => (colRef) => user && query(colRef, where("submittedBy", "==", user.uid)),
    [user]
  );
  const eventsQuery = useMemo(
    () => (colRef) => user && query(colRef, where("attendees", "array-contains", user.uid)),
    [user]
  );
  const familyQuery = useMemo(
    () =>
      (colRef) =>
        userProfile?.apartment && userProfile?.wing
          ? query(
              colRef,
              where("apartment", "==", userProfile.apartment),
              where("wing", "==", userProfile.wing)
            )
          : null,
    [userProfile]
  );

  const { data: visitors = [] } = useCollection("visitors", { queryBuilder: visitorsQuery });
  const { data: complaints = [] } = useCollection("complaints", { queryBuilder: complaintsQuery });
  const { data: participatedEvents = [] } = useCollection("events", { queryBuilder: eventsQuery });
  const { data: familyMembers = [] } = useCollection("users", { queryBuilder: familyQuery });

  if (profileLoading) return <LoadingSpinner />;
  if (profileError)
    return <div className="text-red-500 text-center mt-10">Error: {profileError}</div>;
  if (!userProfile)
    return <div className="text-gray-500 text-center mt-10">No profile data available.</div>;

  const roleBadgeColor =
    userProfile.role === "admin"
      ? "bg-gradient-to-r from-red-400 to-pink-500 text-white"
      : userProfile.role === "security"
      ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white"
      : "bg-gradient-to-r from-green-400 to-emerald-500 text-white";

  const filteredFamily = familyMembers.filter((member) => member.id !== user.uid);

  // Calculate profile completion percentage
  const requiredFields = ["name", "email", "phone", "flatNumber", "apartment", "wing", "profileImage"];
  const filledFields = requiredFields.filter((f) => userProfile[f]);
  const profileCompletion = Math.round((filledFields.length / requiredFields.length) * 100);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-100 py-10 px-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 font-semibold mb-4 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </motion.button>

        {/* Top Profile Card */}
        <motion.div
          className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl overflow-hidden"
          variants={fadeInUp}
        >
          <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="flex flex-col md:flex-row items-center md:items-start p-8 -mt-16 relative z-10">
            <img
              src={userProfile.profileImage || "/default-profile-pic.png"}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center md:justify-start gap-2">
                <User className="w-6 h-6 text-indigo-600" />
                {userProfile.name || "Unnamed User"}
              </h1>
              <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold ${roleBadgeColor}`}>
                {userProfile.role || "Resident"}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-5 text-gray-700">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-500" /> {userProfile.email || "N/A"}</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-500" /> {userProfile.phone || "N/A"}</div>
                <div className="flex items-center gap-2"><Home className="w-4 h-4 text-indigo-500" /> Flat: {userProfile.flatNumber || "N/A"}</div>
                <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" /> {userProfile.apartment || "N/A"} - {userProfile.wing || "N/A"}</div>
              </div>

              {/* Profile Completion Bar */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-600 mb-1">Profile Completion: {profileCompletion}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Floating Buttons */}
            <div className="flex flex-col mt-6 md:mt-0 gap-3">
              <motion.button
                onClick={() => navigate("/edit-profile")}
                className="flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </motion.button>
              <motion.button
                onClick={() => navigate("/family")}
                className="flex items-center justify-center bg-gradient-to-r from-pink-500 to-rose-600 text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition"
              >
                <Users className="w-4 h-4 mr-2" /> Manage Family
              </motion.button>
              <motion.button
                onClick={() => navigate("/gate-pass")}
                className="flex items-center justify-center bg-gradient-to-r from-teal-500 to-green-600 text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition"
              >
                <QrCode className="w-4 h-4 mr-2" /> My QR Pass
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Info Sections */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8" variants={fadeInUp}>
          {/* Family Section */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="text-indigo-600" /> Family Members
            </h2>
            {filteredFamily.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                {filteredFamily.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-all duration-300"
                  >
                    <img
                      src={member.profileImage || "/default-profile-pic.png"}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.role || "Resident"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No family members found.</p>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Car className="text-indigo-600" /> Vehicle Info
            </h2>
            {userProfile.vehicleNumber ? (
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition">
                <p className="font-semibold text-gray-800">Vehicle Number:</p>
                <p className="text-gray-600">{userProfile.vehicleNumber}</p>
              </div>
            ) : (
              <p className="text-gray-500">No vehicle registered.</p>
            )}
          </div>

          {/* Activity Dashboard */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="text-indigo-600" /> Activity Dashboard
            </h2>
            <div className="space-y-4">
              {[
                { label: "Visitors", count: visitors.length, color: "from-indigo-400 to-indigo-600" },
                { label: "Complaints", count: complaints.length, color: "from-pink-400 to-rose-600" },
                { label: "Events Joined", count: participatedEvents.length, color: "from-violet-400 to-purple-600" },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className={`flex justify-between items-center p-4 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-md hover:scale-105 transition`}
                >
                  <span className="font-medium">{stat.label}</span>
                  <span className="text-2xl font-bold">{stat.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bonus Feature Section */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={fadeInUp}>
          {/* Emergency Contacts */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="text-indigo-600" /> Emergency Contacts
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <PhoneCall className="w-4 h-4 text-red-500" /> Society Security: +91 9876543210
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <PhoneCall className="w-4 h-4 text-blue-500" /> Maintenance Helpdesk: +91 9123456789
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <PhoneCall className="w-4 h-4 text-green-500" /> Ambulance: 108
              </div>
            </div>
          </div>

          {/* Download Info Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg rounded-2xl p-6 flex flex-col justify-center items-center">
            <Download className="w-10 h-10 text-indigo-600 mb-3" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Download My Profile</h2>
            <p className="text-gray-600 text-center mb-4">
              Get a PDF copy of your profile, family members, and vehicle info.
            </p>
            <button
              onClick={() => alert("Download feature coming soon!")}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition"
            >
              Download PDF
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
