"use client";

import { usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ProfileView() {
  const pathname = usePathname();
  // Get role from url e.g. /employee/profile -> employee
  const role = pathname?.split('/')[1] || "employee";
  
  const isEmployee = role === "employee";
  const canEditTopSection = !isEmployee;
  const canViewSalaryAndSecurity = !isEmployee;

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Here you would normally save the data to your backend
    setIsEditing(false);
  };

  return (
    <div className="relative bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8">
      {/* Action Buttons */}
      <div className="absolute top-8 right-8 flex gap-3 z-10">
        {isEditing ? (
          <>
            <Button onClick={() => setIsEditing(false)} variant="outline" className="border-outline-variant/30 text-on-surface hover:bg-surface-container-low">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#A463B0] hover:bg-[#8A5294] text-white">
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="bg-[#A463B0] hover:bg-[#8A5294] text-white gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Profile
          </Button>
        )}
      </div>

      {/* Top Section */}
      <div className="flex flex-col md:flex-row gap-12 mb-10 pt-4 md:pt-0">
        {/* Avatar */}
        <div className="flex-shrink-0 relative group w-40 h-40 rounded-full bg-[#5A3C53] flex items-center justify-center border-4 border-surface-container-lowest shadow-md overflow-hidden">
          <span className="text-4xl text-white font-h1">MN</span>
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="material-symbols-outlined text-white text-3xl">edit</span>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl pr-20">
          <div className="col-span-1 md:col-span-2 mb-2">
            <input 
              type="text" 
              defaultValue="My Name" 
              readOnly={!isEditing || !canEditTopSection}
              className={`text-4xl font-h1 font-bold bg-transparent focus:outline-none w-full border-b pb-2 ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent text-on-background"}`}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Job Position</label>
              <input 
                type="text" 
                defaultValue="Software Engineer" 
                readOnly={!isEditing || !canEditTopSection}
                className={`w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Email</label>
              <input 
                type="email" 
                defaultValue="my.name@company.com" 
                readOnly={!isEditing || !canEditTopSection}
                className={`w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Mobile</label>
              <input 
                type="text" 
                defaultValue="+1 234 567 8900" 
                readOnly={!isEditing || !canEditTopSection}
                className={`w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Company</label>
              <input 
                type="text" 
                defaultValue="EmPay Tech" 
                readOnly={!isEditing || !canEditTopSection}
                className={`w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Department</label>
              <input 
                type="text" 
                defaultValue="Engineering" 
                readOnly={!isEditing || !canEditTopSection}
                className={`w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Manager</label>
              <input 
                type="text" 
                defaultValue="Jane Smith" 
                readOnly={!isEditing || !canEditTopSection}
                className={`w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Location</label>
              <input 
                type="text" 
                defaultValue="New York Office" 
                readOnly={!isEditing || !canEditTopSection}
                className={`w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="resume" className="w-full mt-6">
        <TabsList className="w-full justify-start border-b border-outline-variant/30 rounded-none bg-transparent h-auto p-0 gap-6">
          <TabsTrigger 
            value="resume" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface"
          >
            Resume
          </TabsTrigger>
          <TabsTrigger 
            value="private-info" 
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface"
          >
            Private Info
          </TabsTrigger>
          <TabsTrigger 
            value="salary-info" 
            disabled={!canViewSalaryAndSecurity}
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface disabled:opacity-30"
          >
            Salary Info
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            disabled={!canViewSalaryAndSecurity}
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface disabled:opacity-30"
          >
            Security
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {/* Resume Tab */}
          <TabsContent value="resume" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8 border-r border-outline-variant/20 pr-8">
                <div className={`group relative border ${isEditing ? "border-outline-variant/30 hover:border-primary-container/50 bg-surface-container-low/30" : "border-transparent"} p-5 rounded-lg transition-colors`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-h3 text-xl font-bold text-on-surface">About</h3>
                    {isEditing && <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">edit</span>}
                  </div>
                  <Textarea 
                    readOnly={!isEditing}
                    defaultValue="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
                    className={`min-h-[120px] resize-none ${isEditing ? "border-transparent hover:border-outline-variant/30 focus:border-primary-container bg-transparent text-on-surface" : "border-transparent bg-transparent shadow-none px-0 text-on-surface-variant focus-visible:ring-0 focus-visible:ring-offset-0"}`}
                  />
                </div>

                <div className={`group relative border ${isEditing ? "border-outline-variant/30 hover:border-primary-container/50 bg-surface-container-low/30" : "border-transparent"} p-5 rounded-lg transition-colors`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-h3 text-xl font-bold text-on-surface">What I love about my job</h3>
                    {isEditing && <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">edit</span>}
                  </div>
                  <Textarea 
                    readOnly={!isEditing}
                    defaultValue="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
                    className={`min-h-[120px] resize-none ${isEditing ? "border-transparent hover:border-outline-variant/30 focus:border-primary-container bg-transparent text-on-surface" : "border-transparent bg-transparent shadow-none px-0 text-on-surface-variant focus-visible:ring-0 focus-visible:ring-offset-0"}`}
                  />
                </div>

                <div className={`group relative border ${isEditing ? "border-outline-variant/30 hover:border-primary-container/50 bg-surface-container-low/30" : "border-transparent"} p-5 rounded-lg transition-colors`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-h3 text-xl font-bold text-on-surface">My interests and hobbies</h3>
                    {isEditing && <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">edit</span>}
                  </div>
                  <Textarea 
                    readOnly={!isEditing}
                    defaultValue="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
                    className={`min-h-[120px] resize-none ${isEditing ? "border-transparent hover:border-outline-variant/30 focus:border-primary-container bg-transparent text-on-surface" : "border-transparent bg-transparent shadow-none px-0 text-on-surface-variant focus-visible:ring-0 focus-visible:ring-offset-0"}`}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8 pl-0 lg:pl-4">
                <div className="border border-outline-variant/30 p-5 rounded-lg bg-surface-container-low/30">
                  <h3 className="font-h3 text-xl font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2">Skills</h3>
                  <div className="min-h-[120px]">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-[#A463B0]/10 text-[#A463B0] rounded-full text-sm font-medium border border-[#A463B0]/20">React</span>
                      <span className="px-3 py-1 bg-[#A463B0]/10 text-[#A463B0] rounded-full text-sm font-medium border border-[#A463B0]/20">Next.js</span>
                      <span className="px-3 py-1 bg-[#A463B0]/10 text-[#A463B0] rounded-full text-sm font-medium border border-[#A463B0]/20">TypeScript</span>
                    </div>
                  </div>
                  {isEditing && <button className="text-[#A463B0] text-sm font-medium hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">add</span> Add Skills</button>}
                </div>

                <div className="border border-outline-variant/30 p-5 rounded-lg bg-surface-container-low/30">
                  <h3 className="font-h3 text-xl font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2">Certification</h3>
                  <div className="min-h-[120px]">
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-md border border-outline-variant/20 shadow-sm">
                        <div>
                          <p className="font-semibold text-on-surface text-sm">AWS Certified Solutions Architect</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">Amazon Web Services</p>
                        </div>
                        <span className="text-xs font-medium text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">2023</span>
                      </div>
                    </div>
                  </div>
                  {isEditing && <button className="text-[#A463B0] text-sm font-medium hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">add</span> Add Certification</button>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Private Info Tab */}
          <TabsContent value="private-info" className="outline-none">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Date of Birth</label>
                   <Input readOnly={!isEditing} type={isEditing ? "date" : "text"} className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="1990-01-01" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Residing Address</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="123 Main St, City, Country" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Nationality</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="American" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Personal Email</label>
                   <Input readOnly={!isEditing} type="email" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="personal@example.com" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Gender</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="Male" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Marital Status</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="Single" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Date of Joining</label>
                   <Input readOnly={!isEditing} type={isEditing ? "date" : "text"} className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="2022-06-15" />
                 </div>
               </div>

               <div className="space-y-6">
                 <h3 className="font-h3 text-xl font-bold text-on-surface border-b border-outline-variant/30 pb-2 mb-4">Bank Details</h3>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Account Number</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="123456789012" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Bank Name</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="Chase Bank" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">IFSC Code</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="CHAS000123" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">PAN No</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="ABCDE1234F" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">UAN NO</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="100012345678" />
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                   <label className="w-40 text-on-surface-variant font-medium text-sm">Emp Code</label>
                   <Input readOnly={!isEditing} type="text" className={`flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`} defaultValue="EMP001" />
                 </div>
               </div>
             </div>
          </TabsContent>

          {/* Salary Info Tab */}
          <TabsContent value="salary-info" className="outline-none">
            {canViewSalaryAndSecurity ? (
               <div className="p-12 border border-outline-variant/30 rounded-xl text-center bg-surface-container-low/30">
                 <span className="material-symbols-outlined text-5xl text-outline mb-3">payments</span>
                 <h3 className="text-xl font-medium text-on-surface mb-2">Salary Information</h3>
                 <p className="text-on-surface-variant">Confidential salary and compensation details.</p>
               </div>
            ) : null}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="outline-none">
            {canViewSalaryAndSecurity ? (
               <div className="p-12 border border-outline-variant/30 rounded-xl text-center bg-surface-container-low/30">
                 <span className="material-symbols-outlined text-5xl text-outline mb-3">lock</span>
                 <h3 className="text-xl font-medium text-on-surface mb-2">Security Settings</h3>
                 <p className="text-on-surface-variant">Password, 2FA and access control.</p>
               </div>
            ) : null}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
