"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, CalendarCheck, Settings, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { userData } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [slotDuration, setSlotDuration] = useState("120"); // default 2 hrs

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(users);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { status: "confirmed" });
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert("Failed to confirm user.");
    }
  };

  if (!userData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold flex items-center text-foreground">
          <ShieldCheck className="w-8 h-8 mr-3 text-primary" />
          Admin Control Center
        </h1>
        <p className="text-slate-500 mt-2">Manage employee registrations and system configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Registration Approval Module */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Users className="w-6 h-6 mr-2 text-primary" />
              Pending Registrations
            </h2>
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">{pendingUsers.length}</span>
          </div>

          <div className="space-y-4">
            {pendingUsers.length === 0 ? (
              <div className="text-center p-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                No pending registrations at the moment.
              </div>
            ) : (
              pendingUsers.map(user => (
                <div key={user.id} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex justify-between items-center transition-all hover:border-slate-300">
                  <div>
                    <h3 className="font-bold text-foreground">{user.name || "Unknown User"}</h3>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded mt-1 inline-block text-slate-600 dark:text-slate-300">ID: {user.employeeId}</p>
                  </div>
                  <button
                    onClick={() => confirmUser(user.id)}
                    className="flex items-center justify-center p-3 sm:px-4 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow shadow-green-500/20 transition-all font-bold group"
                  >
                    <CheckCircle2 className="w-5 h-5 sm:mr-2 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:block">Authorize</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Settings Module */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
             <h2 className="text-2xl font-bold flex items-center mb-6">
               <Settings className="w-6 h-6 mr-2 text-slate-400" />
               Global Settings
             </h2>
             
             <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Default Slot Duration (Minutes)</label>
                <div className="flex gap-4">
                  <input 
                    type="number" 
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary"
                  />
                  <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90">
                    Save
                  </button>
                </div>
                <p className="text-sm text-slate-500 mt-3">
                  Adjust this during specific periods (like Ramadan) to automatically format available time blocks across the dashboards.
                </p>
             </div>
           </div>

           <div className="bg-orange-50 dark:bg-orange-950/20 rounded-[2rem] p-8 shadow-sm border border-orange-100 dark:border-orange-900/30">
               <h3 className="font-bold text-orange-800 dark:text-orange-400 mb-2 text-lg">System Metrics Overview</h3>
               <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-orange-100/50 dark:border-orange-900/50">
                    <p className="text-sm text-slate-500 font-medium">Total Bookings</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">0</p>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-orange-100/50 dark:border-orange-900/50">
                    <p className="text-sm text-slate-500 font-medium">Active Users</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">0</p>
                 </div>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
}
