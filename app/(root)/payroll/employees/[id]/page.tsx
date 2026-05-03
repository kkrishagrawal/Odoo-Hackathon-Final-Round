"use client";

import { useParams } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";

export default function AdminEmployeeProfilePage() {
  const params = useParams();
  const employeeId = params?.id as string;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-h1 font-bold text-on-background">Employee Profile</h1>
      </div>
      
      <ProfileView targetUserId={employeeId} />
    </div>
  );
}
