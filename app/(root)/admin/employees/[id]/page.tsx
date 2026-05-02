import { ProfileView } from "@/components/profile/ProfileView";

export default function AdminEmployeeProfilePage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-h1 font-bold text-on-background">Employee Profile</h1>
      </div>
      
      <ProfileView />
    </div>
  );
}
