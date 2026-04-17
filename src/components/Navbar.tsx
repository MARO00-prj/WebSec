"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, Home, Bell, Users, ClipboardList, CalendarCheck, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { userData, signOut } = useAuth();
  const pathname = usePathname();

  // If on login page or no userData exists, don't show full navbar
  if (!userData || pathname === "/login") return null;

  const role = userData.role;

  const links = [];

  if (role === "admin") {
    links.push({ name: "Home", href: "/admin", icon: Home });
    links.push({ name: "Bookings", href: "/admin/bookings", icon: CalendarCheck });
    links.push({ name: "Registration", href: "/admin/registrations", icon: Users });
  } else if (role === "manager") {
    links.push({ name: "Home", href: "/manager", icon: Home });
    links.push({ name: "Requests", href: "/manager/requests", icon: ClipboardList });
    links.push({ name: "User Details", href: "/manager/users", icon: Users });
  } else if (role === "secretary") {
    links.push({ name: "Booking Page", href: "/secretary", icon: BookOpen });
  } else {
    links.push({ name: "Home", href: "/employee", icon: Home });
    links.push({ name: "My Bookings", href: "/employee/bookings", icon: CalendarCheck });
  }

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex overflow-x-auto">
            <div className="flex-shrink-0 flex items-center mr-8">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">AASTMT</span>
            </div>
            <div className="hidden sm:-my-px sm:flex sm:space-x-8">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300 dark:hover:border-slate-700"
                    } transition-colors duration-200`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="whitespace-nowrap">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 ml-6 flex-shrink-0">
             {["manager", "secretary", "admin"].includes(role) && (
               <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 block w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
               </button>
             )}
             
            {(role === "secretary") && (
              <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                <Users className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={signOut}
              className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-xl text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 dark:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Links Container */}
      <div className="sm:hidden px-2 pt-2 pb-3 space-y-1">
          {links.map((link) => {
             const Icon = link.icon;
             const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
             return (
               <Link
                 key={link.name}
                 href={link.href}
                 className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                   isActive
                     ? "bg-primary/10 text-primary border-l-4 border-primary"
                     : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 border-l-4 border-transparent"
                 }`}
               >
                 <Icon className="w-5 h-5 mr-3" />
                 {link.name}
               </Link>
             )
          })}
      </div>
    </nav>
  );
}
