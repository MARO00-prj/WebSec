"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !userData) {
        router.push("/login");
      } else {
        if (userData.role === "admin") router.push("/admin");
        else if (userData.role === "manager") router.push("/manager");
        else if (userData.role === "secretary") router.push("/secretary");
        else router.push("/employee");
      }
    }
  }, [user, userData, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
