"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Info, CalendarClock, Laptop, Mic, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { addDays, format } from "date-fns";

export default function EmployeeDashboard() {
  const { userData } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Basic states for booking
  const [roomType, setRoomType] = useState<"lecture" | "multi_purpose">("lecture");
  const [attendees, setAttendees] = useState("30");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("08:30 - 10:30");
  const [needsMic, setNeedsMic] = useState(false);
  const [needsLaptop, setNeedsLaptop] = useState(false);
  
  const [statusMsg, setStatusMsg] = useState("");

  if (!userData) return null;

  if (userData.status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
        <div className="w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-orange-100 dark:border-orange-500/20">
          <Clock className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-foreground">Approval Pending</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
          Your account is currently under review by an administrator. You will gain access to booking features once approved.
        </p>
      </div>
    );
  }

  // 24h lead time for Employees
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "bookings"), {
        userId: userData.uid,
        userName: userData.name || userData.email,
        roomType,
        attendees: parseInt(attendees),
        date,
        slot,
        requirements: {
          mic: needsMic,
          laptop: needsLaptop
        },
        status: "Pending",
        type: "Normal",
        createdAt: serverTimestamp()
      });
      setStatusMsg("Request submitted successfully! Tracking number assigned.");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to submit request. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome back, {userData.name?.split(' ')[0] || "User"}
          </h1>
          <p className="text-lg text-slate-500 mt-2">Ready to schedule your next session?</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center group"
        >
          <CalendarClock className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
          New Request
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl mb-8 flex items-center animate-in fade-in slide-in-from-top-4 ${statusMsg.includes("success") ? "bg-green-50/80 text-green-700 border border-green-200" : "bg-red-50/80 text-red-700 border border-red-200"}`}>
          {statusMsg.includes("success") ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          <span className="font-medium">{statusMsg}</span>
        </div>
      )}

      {/* Decorative empty state dashboard view for employee */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
               <CalendarClock className="w-6 h-6" />
             </div>
             <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Pending Approvals</h3>
             <p className="text-4xl font-bold mt-2 text-foreground">0</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
               <CheckCircle2 className="w-6 h-6" />
             </div>
             <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Upcoming Classes</h3>
             <p className="text-4xl font-bold mt-2 text-foreground">0</p>
        </div>
      </div>

      {/* Booking Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Book a Space</h2>
              <p className="text-slate-500 mt-1">Please note the 24-hour advance notice requirement.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Room Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRoomType("lecture")}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-200 ${roomType === "lecture" ? "border-primary bg-primary/5 text-primary" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"}`}
                  >
                    <Users className="w-8 h-8 mb-2" />
                    <span className="font-semibold text-sm">Lecture Hall</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType("multi_purpose")}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-200 ${roomType === "multi_purpose" ? "border-primary bg-primary/5 text-primary" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"}`}
                  >
                    <Info className="w-8 h-8 mb-2" />
                    <span className="font-semibold text-sm">Multi-Purpose</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated Attendees</label>
                <input required type="number" min="1" value={attendees} onChange={e => setAttendees(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Date</label>
                  <input required type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Time Slot</label>
                  <select value={slot} onChange={e => setSlot(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200">
                    <option>08:30 - 10:30</option>
                    <option>10:30 - 12:30</option>
                    <option>12:30 - 14:30</option>
                    <option>14:30 - 16:30</option>
                  </select>
                </div>
              </div>

              {roomType === "multi_purpose" && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Facility Requirements</p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center space-x-3 p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${needsMic ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                      <Mic className={`w-5 h-5 flex-shrink-0 ${needsMic ? "text-primary" : "text-slate-400"}`} />
                      <span className={`font-semibold text-sm ${needsMic ? "text-foreground" : "text-slate-600 dark:text-slate-400"}`}>Microphone</span>
                      <input type="checkbox" className="sr-only" checked={needsMic} onChange={e => setNeedsMic(e.target.checked)} />
                    </label>
                    <label className={`flex items-center space-x-3 p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${needsLaptop ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                      <Laptop className={`w-5 h-5 flex-shrink-0 ${needsLaptop ? "text-primary" : "text-slate-400"}`} />
                      <span className={`font-semibold text-sm ${needsLaptop ? "text-foreground" : "text-slate-600 dark:text-slate-400"}`}>Projector Display</span>
                      <input type="checkbox" className="sr-only" checked={needsLaptop} onChange={e => setNeedsLaptop(e.target.checked)} />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl hover:shadow-primary/20">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
