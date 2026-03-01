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
  CheckCircle,
  Briefcase
} from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { userProfile, loading: profileLoading, error: profileError } = useFirestore();

  // Firestore queries for related data
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

  const { data: visitors = [] } = useCollection("visitors", { queryBuilder: visitorsQuery });
  const { data: complaints = [] } = useCollection("complaints", { queryBuilder: complaintsQuery });
  const { data: participatedEvents = [] } = useCollection("events", { queryBuilder: eventsQuery });

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

  // Calculate profile completion percentage
  const requiredFields = ["name", "email", "phone", "flatNumber", "apartment", "wing", "profileImage", "emergencyContact"];
  const filledFields = requiredFields.filter((f) => userProfile[f]);
  const profileCompletion = Math.round((filledFields.length / requiredFields.length) * 100);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Navigation */}
        <motion.div className="flex justify-between items-center" variants={fadeInUp}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 font-black hover:bg-white dark:hover:bg-slate-900 px-4 py-2 rounded-2xl transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> DASHBOARD
          </button>
          <div className="flex gap-4">
            <button className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-[3rem] overflow-hidden"
          variants={fadeInUp}
        >
          <div className="h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
          <div className="flex flex-col md:flex-row items-center md:items-start p-10 -mt-20 relative z-10 gap-8">
            <div className="relative group">
              <img
                src={userProfile.profileImage || `https://ui-avatars.com/api/?name=${userProfile.name || 'User'}&background=random`}
                alt="Profile"
                className="w-40 h-40 rounded-[3rem] border-8 border-white dark:border-slate-900 shadow-2xl object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white dark:border-slate-900">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="text-center md:text-left flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {userProfile.name || "Unknown Resident"}
                </h1>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${roleBadgeColor}`}>
                  {userProfile.role || "Resident"}
                </span>
                <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                  {userProfile.ownership || "Owner"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-indigo-500" /> {userProfile.email}</div>
                <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-indigo-500" /> {userProfile.phone || "No phone linked"}</div>
                <div className="flex items-center gap-3"><Home className="w-5 h-5 text-indigo-500" /> Wing {userProfile.wing || "A"} - {userProfile.flatNumber || "XXX"}</div>
                <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-indigo-500" /> {userProfile.apartment || "Society Resident"}</div>
              </div>

              <div className="pt-4 max-w-md">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Status</p>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{profileCompletion}% Complete</p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full"
                  ></motion.div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[180px]">
              <button
                onClick={() => navigate("/edit-profile")}
                className="w-full px-6 py-4 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-[1.5rem] font-black shadow-xl hover:scale-[1.02] transition active:scale-95"
              >
                EDIT PROFILE
              </button>
              <button
                onClick={() => navigate("/visitor-approval")}
                className="w-full px-6 py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] font-black shadow-sm flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" /> PASSES
              </button>
            </div>
          </div>
        </motion.div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Family & Help */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <Users className="text-purple-600" /> Family Network
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(userProfile.familyMembers || []).length > 0 ? (
                  userProfile.familyMembers.map((member, i) => (
                    <div key={i} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white">{member.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.relation} • {member.age} Yrs</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-400 font-bold italic">No family members registered.</div>
                )}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <Briefcase className="text-orange-500" /> Domestic Help
              </h3>
              <div className="space-y-4">
                {(userProfile.helpers || []).length > 0 ? (
                  userProfile.helpers.map((helper, i) => (
                    <div key={i} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-black text-indigo-600">
                        {helper.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 dark:text-white">{helper.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{helper.role} • {helper.timing}</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"><CheckCircle className="w-4 h-4" /> VERIFIED</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 font-bold italic">No help logs found.</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Side Info */}
          <div className="space-y-8">
            <motion.div variants={fadeInUp} className="bg-gradient-to-br from-rose-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-2xl">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <Shield className="animate-pulse" /> Emergency Contact
              </h3>
              {userProfile.emergencyContact ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-red-100 uppercase tracking-widest leading-none mb-1">Primary Guardian</p>
                    <p className="text-2xl font-black">{userProfile.emergencyContact.name}</p>
                    <p className="text-xs font-bold text-red-100 uppercase tracking-widest opacity-70">{userProfile.emergencyContact.relation}</p>
                  </div>
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-xl font-black tracking-tighter">{userProfile.emergencyContact.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-red-100 italic">Not configured! Update in settings.</p>
              )}
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6">Activity Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-xs font-black text-slate-500 uppercase">Visitors Hosted</span>
                  <span className="text-xl font-black text-indigo-600">{visitors.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-xs font-black text-slate-500 uppercase">Reported Issues</span>
                  <span className="text-xl font-black text-rose-600">{complaints.length}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
