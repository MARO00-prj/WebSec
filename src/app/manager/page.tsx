"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Printer, CalendarClock, Users, CheckCircle2, AlertCircle, Clock, X, ChevronRight, CornerDownRight } from "lucide-react";
import { format } from "date-fns";

export default function ManagerDashboard() {
  const { userData } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  // Decision Form State
  const [decision, setDecision] = useState<"Approve" | "Reject" | null>(null);
  const [assignedRoom, setAssignedRoom] = useState("");
  const [managerComment, setManagerComment] = useState("");
  const [suggestedRoom, setSuggestedRoom] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct Booking State
  const [isDirectBookingOpen, setIsDirectBookingOpen] = useState(false);
  const [dbRoomType, setDbRoomType] = useState<"lecture" | "multi_purpose">("lecture");
  const [dbAttendees, setDbAttendees] = useState("30");
  const [dbDate, setDbDate] = useState("");
  const [dbSlot, setDbSlot] = useState("08:30 - 10:30");

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      const q = query(
        collection(db, "bookings"),
        where("status", "==", "Pending")
      );
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by creation date (highest priority)
      fetched.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0) || (b.id.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPendingBookings(fetched);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !decision) return;
    setIsSubmitting(true);

    try {
      const updateData: any = {
        status: decision === "Approve" ? "Accepted" : "Refused",
        managerActionAt: serverTimestamp(),
        managerActionBy: userData?.uid,
      };

      if (decision === "Approve") {
        updateData.assignedRoom = assignedRoom;
      } else {
        updateData.manager_comment = managerComment;
        updateData.suggested_alternative_room = suggestedRoom;
      }

      await updateDoc(doc(db, "bookings", selectedBooking.id), updateData);
      
      // Remove from pending locally
      setPendingBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      setSelectedBooking(null);
      setDecision(null);
      setAssignedRoom("");
      setManagerComment("");
      setSuggestedRoom("");
    } catch (err) {
      console.error(err);
      alert("Failed to process decision. Check your permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "bookings"), {
        userId: userData?.uid,
        userName: userData?.name || "Manager",
        roomType: dbRoomType,
        attendees: parseInt(dbAttendees),
        date: dbDate,
        slot: dbSlot,
        status: "Accepted", // Instant Save directly accepted
        type: "Normal",
        createdAt: serverTimestamp(),
      });
      setIsDirectBookingOpen(false);
      alert("Booking saved successfully!");
    } catch(err) {
       console.error(err);
    }
  }

  const printReport = () => {
    window.print();
  };

  if (!userData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Branch Manager Dashboard
          </h1>
          <p className="text-slate-500 mt-2">Oversee incoming requests and system utilization</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={printReport}
            className="flex-1 sm:flex-none flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors print:hidden"
          >
            <Printer className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button
            onClick={() => setIsDirectBookingOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-colors print:hidden"
          >
            <CalendarClock className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Direct Save</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Pending Requests */}
        <div className="lg:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-0 lg:pr-8">
          <h2 className="text-xl font-bold mb-6 flex items-center text-foreground">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Pending Requests ({pendingBookings.length})
          </h2>
          
          <div className="space-y-4">
            {pendingBookings.map(booking => (
              <div 
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 block ${selectedBooking?.id === booking.id ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center uppercase tracking-wider">
                    {booking.roomType === "lecture" ? <Users className="w-4 h-4 mr-2 text-slate-400" /> : <div className="w-4 h-4 mr-2 rounded-sm bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">M</div>}
                    {booking.roomType.replace("_", "-")}
                  </h3>
                  {booking.type === "Emergency" && (
                     <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-md font-bold">URGENT</span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{booking.userName}</p>
                <div className="mt-3 flex items-center text-xs text-slate-500 gap-3">
                   <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{booking.date}</span>
                   <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{booking.slot}</span>
                </div>
              </div>
            ))}
            {pendingBookings.length === 0 && (
              <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
                All caught up! No pending requests.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Decision View */}
        <div className="lg:col-span-2">
          {selectedBooking ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Request Details</h2>
                  <p className="text-slate-500 mt-1">Submitted by <span className="font-medium text-slate-700 dark:text-slate-300">{selectedBooking.userName}</span></p>
                </div>
                <span className="bg-orange-10px border border-orange-200 text-orange-700 font-bold px-3 py-1 rounded-lg text-sm bg-orange-50">Pending Review</span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                  <p className="text-sm text-slate-500 mb-1">Target Date</p>
                  <p className="font-bold text-foreground">{selectedBooking.date}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                  <p className="text-sm text-slate-500 mb-1">Time Slot</p>
                  <p className="font-bold text-foreground">{selectedBooking.slot}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                  <p className="text-sm text-slate-500 mb-1">Room Type</p>
                  <p className="font-bold text-foreground capitalize">{selectedBooking.roomType.replace("_", " ")}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                  <p className="text-sm text-slate-500 mb-1">Attendees</p>
                  <p className="font-bold text-foreground">{selectedBooking.attendees} People</p>
                </div>
              </div>

              {selectedBooking.requirements && (
                <div className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Special Requirements</p>
                  <div className="flex gap-4">
                    {selectedBooking.requirements.mic && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">Microphone Needs</span>}
                    {selectedBooking.requirements.laptop && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">Projector/Laptop</span>}
                  </div>
                </div>
              )}

              <hr className="border-slate-100 dark:border-slate-800 mb-8" />

              <form onSubmit={handleDecisionSubmit}>
                <h3 className="text-lg font-bold mb-4">Your Decision</h3>
                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setDecision("Approve")}
                    className={`flex-1 flex items-center justify-center px-4 py-4 rounded-xl border-2 transition-all font-bold ${decision === "Approve" ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20" : "border-slate-200 dark:border-slate-700 text-slate-600 hover:border-green-300"}`}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Approve Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("Reject")}
                    className={`flex-1 flex items-center justify-center px-4 py-4 rounded-xl border-2 transition-all font-bold ${decision === "Reject" ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20" : "border-slate-200 dark:border-slate-700 text-slate-600 hover:border-red-300"}`}
                  >
                    <AlertCircle className="w-5 h-5 mr-2" /> Refuse Request
                  </button>
                </div>

                {decision === "Approve" && (
                  <div className="bg-green-50/50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 mb-6 animate-in slide-in-from-top-4">
                    <label className="block text-sm font-bold text-green-800 dark:text-green-400 mb-2">Assign Room Number</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Hall 401"
                      value={assignedRoom}
                      onChange={e => setAssignedRoom(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {decision === "Reject" && (
                  <div className="bg-red-50/50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 mb-6 animate-in slide-in-from-top-4 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-red-800 dark:text-red-400 mb-2">Refusal Reason (Mandatory)</label>
                      <textarea 
                        required
                        placeholder="Brief explanation for the employee..."
                        value={managerComment}
                        onChange={e => setManagerComment(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500 min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-red-800 dark:text-red-400 mb-2 flex items-center">
                        <CornerDownRight className="w-4 h-4 mr-1" /> Suggest Alternative Room?
                      </label>
                      <select 
                        value={suggestedRoom}
                        onChange={e => setSuggestedRoom(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">No alternative</option>
                        <option value="Hall 102">Hall 102 (Available)</option>
                        <option value="Hall 205">Hall 205 (Available)</option>
                        <option value="Multi 001">Multi-Purpose 001 (Available)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setSelectedBooking(null); setDecision(null); }} className="px-5 py-2.5 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                  <button disabled={!decision || isSubmitting} type="submit" className="px-5 py-2.5 text-white font-bold bg-primary hover:bg-primary-dark rounded-xl disabled:opacity-50">Submit Decision</button>
                </div>
              </form>
            </div>
          ) : (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 text-center p-8">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                 <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600" />
               </div>
               <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500 mb-2">No Request Selected</h3>
               <p className="text-slate-400 dark:text-slate-500 max-w-sm">Select a pending request from the left sidebar to review details and make a decision.</p>
             </div>
          )}
        </div>
      </div>

       {/* Direct Save Modal */}
      {isDirectBookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDirectBookingOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-foreground mb-6">Direct Save Booking (Bypass Workflow)</h2>
            <form onSubmit={handleDirectBooking} className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Room Type</label>
                  <select value={dbRoomType} onChange={e => setDbRoomType(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option value="lecture">Lecture Hall</option>
                    <option value="multi_purpose">Multi-Purpose Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Attendees</label>
                  <input required type="number" min="1" value={dbAttendees} onChange={e => setDbAttendees(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Date</label>
                  <input required type="date" value={dbDate} onChange={e => setDbDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Slot</label>
                  <select value={dbSlot} onChange={e => setDbSlot(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <option>08:30 - 10:30</option>
                    <option>10:30 - 12:30</option>
                    <option>12:30 - 14:30</option>
                    <option>14:30 - 16:30</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsDirectBookingOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark">Save Immediately</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
