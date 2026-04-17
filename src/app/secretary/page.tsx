"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Info, CalendarClock, Laptop, Mic, CheckCircle2, AlertCircle, Clock, BellRing, ChevronRight } from "lucide-react";
import { addDays, format } from "date-fns";

export default function SecretaryDashboard() {
  const { userData } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  
  const [attendees, setAttendees] = useState("50");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("08:30 - 10:30");
  const [needsMic, setNeedsMic] = useState(false);
  const [needsLaptop, setNeedsLaptop] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // 48h lead time for Secretary
  const minDate = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  useEffect(() => {
    if (userData?.uid) {
      fetchBookings();
    }
  }, [userData]);

  const fetchBookings = async () => {
    try {
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", userData?.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentBookings(fetched);
    } catch (err) {
      console.error(err);
    }
  };

  if (!userData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "bookings"), {
        userId: userData.uid,
        userName: userData.name || "Secretary",
        roomType: "multi_purpose", // Restricted to multi-purpose
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
      setStatusMsg("Multi-Purpose room request submitted successfully.");
      setIsModalOpen(false);
      fetchBookings();
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to submit request.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Secretary Portal
          </h1>
          <p className="text-lg text-slate-500 mt-2">Manage Multi-Purpose Room Bookings</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center group"
        >
          <CalendarClock className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
          Book Multi-Purpose Area
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl mb-8 flex items-center animate-in fade-in ${statusMsg.includes("success") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {statusMsg.includes("success") ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          <span className="font-medium">{statusMsg}</span>
        </div>
      )}

      {/* Notifications / Status Section */}
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <BellRing className="w-6 h-6 mr-3 text-primary" />
        Booking Notifications
      </h2>
      
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {recentBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No booking requests found.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {recentBookings.slice(0, 5).map(booking => (
              <li key={booking.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    booking.status === "Accepted" ? "bg-green-100 text-green-600" :
                    booking.status === "Refused" ? "bg-red-100 text-red-600" :
                    "bg-orange-100 text-orange-600"
                  }`}>
                    {booking.status === "Accepted" ? <CheckCircle2 className="w-6 h-6" /> :
                     booking.status === "Refused" ? <AlertCircle className="w-6 h-6" /> :
                     <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Multi-Purpose Room ({booking.date})</h4>
                    <p className="text-sm text-slate-500 flex items-center mt-1">
                      Slot: {booking.slot} | {booking.attendees} Attendees
                    </p>
                    {booking.status === "Refused" && booking.manager_comment && (
                      <p className="text-sm text-red-600 mt-2 font-medium bg-red-50 p-2 rounded-lg inline-block">
                        Reason: {booking.manager_comment}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                  booking.status === "Accepted" ? "bg-green-100 text-green-700" :
                  booking.status === "Refused" ? "bg-red-100 text-red-700" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {booking.status}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Booking Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground flex items-center">
                 <Info className="text-primary w-6 h-6 mr-2" />
                 Book Multi-Purpose Room
              </h2>
              <p className="text-slate-500 mt-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                 Notice: Policy requires a minimum **48-hour** notice for multi-purpose room requests.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated Attendees</label>
                <input required type="number" min="1" value={attendees} onChange={e => setAttendees(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Date (min 48h)</label>
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

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
