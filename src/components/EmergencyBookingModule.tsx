"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AlertOctagon, Zap } from "lucide-react";
import { format } from "date-fns";

export default function EmergencyBookingModule() {
  const { userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [attendees, setAttendees] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restricted if not logged in or in pending state
  if (!userData || userData.status === "pending") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        userId: userData.uid,
        userName: userData.name || userData.email,
        roomType: "lecture", // Assuming emergency is default lecture
        attendees: parseInt(attendees),
        date: format(new Date(), 'yyyy-MM-dd'),
        slot: "Immediate",
        status: "Pending", // Needs immediate admin/manager oversight
        type: "Emergency",
        createdAt: serverTimestamp()
      });
      alert("Emergency request dispatched! The Manager has been notified.");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send emergency request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-red-700 hover:scale-110 transition-all duration-300 z-50 animate-pulse origin-center group"
        title="Emergency Booking"
      >
        <Zap className="w-6 h-6 group-hover:hidden" />
        <AlertOctagon className="w-6 h-6 hidden group-hover:block" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-900/60 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative border-2 border-red-500 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-red-600">Emergency Booking</h2>
              <p className="text-slate-500 mt-2 text-sm">
                 Use this to bypass lead-time restrictions for an immediate, urgent physical space requirement today.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated Attendees</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={attendees} 
                  onChange={e => setAttendees(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:border-red-500 bg-red-50/30 dark:bg-slate-800 focus:ring-4 focus:ring-red-500/20" 
                />
              </div>

              <div className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-200 text-sm font-medium">
                 Your request will be marked as <b>URGENT</b> for today ({format(new Date(), 'yyyy-MM-dd')}) and flagged to the Branch Manager instantly.
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-500/30">
                  {isSubmitting ? "Dispatching..." : "Dispatch Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
