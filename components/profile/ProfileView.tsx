"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useAuth, AuthUser } from "@/components/auth/AuthContext";
import { requestPasswordReset, changePasswordDirect } from "@/app/actions/security";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { SalaryInfoTab } from "./SalaryInfoTab";

interface ProfileViewProps {
  /** When set, fetch this user's profile instead of the logged-in user's */
  targetUserId?: string;
}

export function ProfileView({ targetUserId }: ProfileViewProps) {
  const { user: authUser, refreshUser } = useAuth();

  const isEmployee = authUser?.role === "EMPLOYEE";
  const isPayrollOfficer = authUser?.role === "PAYROLL_OFFICER";
  const isHR = authUser?.role === "HR_OFFICER";
  const isAdmin = authUser?.role === "ADMIN";
  const isViewingOther = !!targetUserId && targetUserId !== authUser?.id;
  const isSelf = !isViewingOther;

  // When viewing another user, admin/hr/payroll can edit everything
  const canEditTopSection = isViewingOther
    ? (isAdmin || isHR || isPayrollOfficer)  // viewing someone else's profile
    : !isEmployee;                            // viewing own profile

  const canViewSalaryAndSecurity = isAdmin || isPayrollOfficer || isSelf;
  const canEditSalary = isAdmin || isPayrollOfficer;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!targetUserId);
  const [targetUser, setTargetUser] = useState<AuthUser | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Password Reset State (Admin)
  const [requestingPassword, setRequestingPassword] = useState(false);

  // Direct Password Change State (non-Admin)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // The user data to display: either the fetched target user or the logged-in user
  const displayUser = isViewingOther ? targetUser : authUser;

  // Fetch target user data when viewing someone else's profile
  useEffect(() => {
    if (!targetUserId) return;

    setLoading(true);
    fetch(`/api/user/${targetUserId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then(data => {
        if (data.user) setTargetUser(data.user);
      })
      .catch(err => console.error("Error fetching user:", err))
      .finally(() => setLoading(false));
  }, [targetUserId]);

  const handleSave = async () => {
    if (!formRef.current || !displayUser) return;
    setSaving(true);

    // Collect all inputs from the form container
    const inputs = formRef.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[data-field], textarea[data-field]");
    const updates: Record<string, unknown> = {};
    const bankUpdates: Record<string, string> = {};

    inputs.forEach((input) => {
      const field = input.getAttribute("data-field");
      const group = input.getAttribute("data-group");
      if (!field) return;

      const value = input.value?.trim() || null;

      if (group === "bank") {
        if (value) bankUpdates[field] = value;
      } else {
        updates[field] = value;
      }
    });

    if (Object.keys(bankUpdates).length > 0) {
      updates.bankDetails = bankUpdates;
    }

    // If editing another user, include their userId
    if (isViewingOther && targetUserId) {
      updates.userId = targetUserId;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (isViewingOther && data.user) {
          // Update the local target user state
          setTargetUser(data.user);
        } else {
          // Refresh self
          await refreshUser();
        }
        toast.success("Profile saved successfully.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save profile.");
        console.error("Save failed:", data.error);
      }
    } catch (err) {
      toast.error("An unexpected error occurred while saving.");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleRequestPasswordChange = async () => {
    setRequestingPassword(true);
    try {
      const result = await requestPasswordReset();
      if (result.success) {
        if (result.emailSent) {
          toast.success("Password reset link has been sent to your email.");
        } else if (result.fallbackLink) {
          toast.warning("SMTP delivery failed in dev mode. Check console or use fallback link.", {
            description: result.fallbackLink,
            duration: 10000,
            action: {
              label: "Open Link",
              onClick: () => window.open(result.fallbackLink, "_blank")
            }
          });
        }
      } else {
        toast.error(result.error || "Failed to request password reset.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setRequestingPassword(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8 animate-pulse">
        <div className="flex gap-12 mb-10">
          <div className="w-40 h-40 rounded-full bg-surface-container-low" />
          <div className="flex-1 space-y-4">
            <div className="h-10 bg-surface-container-low rounded w-64" />
            <div className="h-5 bg-surface-container-low rounded w-48" />
            <div className="h-5 bg-surface-container-low rounded w-40" />
          </div>
        </div>
      </div>
    );
  }

  // User initials for avatar
  const initials = displayUser?.name
    ? displayUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  // Deterministic local avatar logic based on ID
  const imageFiles = [
    "image.png",
    "image copy.png",
    ...Array.from({ length: 14 }, (_, i) => `image copy ${i + 2}.png`),
  ];
  const imageIndex = displayUser?.id
    ? displayUser.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % imageFiles.length
    : 0;
  const localAvatarUrl = `/profile/${imageFiles[imageIndex]}`;

  // Helper for input className
  const editableClass = (canEdit: boolean) =>
    `w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface ${isEditing && canEdit ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent"}`;

  const privateFieldClass = `flex-1 ${isEditing ? "bg-surface-container-low border-outline-variant/30" : "bg-transparent border-transparent shadow-none px-0 text-on-surface focus-visible:ring-0"}`;

  return (
    <div ref={formRef} className="relative bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-8">
      {/* Action Buttons */}
      <div className="absolute top-8 right-8 flex gap-3 z-10">
        {isEditing ? (
          <>
            <Button onClick={() => setIsEditing(false)} variant="outline" className="border-outline-variant/30 text-on-surface hover:bg-surface-container-low" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#A463B0] hover:bg-[#8A5294] text-white" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
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
          {displayUser?.profilePicUrl || localAvatarUrl ? (
            <img src={displayUser?.profilePicUrl || localAvatarUrl} alt={displayUser?.name || "Profile"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-white font-h1">{initials}</span>
          )}
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
              type="text" data-field="name"
              defaultValue={displayUser?.name || ""} key={`name-${displayUser?.name}`}
              readOnly={!isEditing || !canEditTopSection}
              className={`text-4xl font-h1 font-bold bg-transparent focus:outline-none w-full border-b pb-2 ${isEditing && canEditTopSection ? "border-outline-variant/50 focus:border-primary-container" : "border-transparent text-on-background"}`}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Login ID</label>
              <input type="text" value={displayUser?.id || "—"} readOnly className="w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface border-transparent" />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Email</label>
              <input
                type="email" data-field="email"
                defaultValue={displayUser?.email || ""} key={`email-${displayUser?.email}`}
                readOnly={!isEditing || !canEditTopSection}
                className={editableClass(canEditTopSection)}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Mobile</label>
              <input
                type="text" data-field="phone"
                defaultValue={displayUser?.phone || ""} key={`phone-${displayUser?.phone}`}
                readOnly={!isEditing || !canEditTopSection}
                className={editableClass(canEditTopSection)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Company</label>
              <input type="text" value={displayUser?.company?.name || "—"} readOnly className="w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface border-transparent" />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Company ID</label>
              <input type="text" value={displayUser?.companyId || "—"} readOnly className="w-full bg-transparent border-b py-1 mt-1 focus:outline-none text-on-surface border-transparent font-mono text-xs" />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Department</label>
              <input
                type="text" data-field="department"
                defaultValue={displayUser?.department || ""} key={`dept-${displayUser?.department}`}
                readOnly={!isEditing || !canEditTopSection}
                className={editableClass(canEditTopSection)}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Job Position</label>
              <input
                type="text" data-field="jobPosition"
                defaultValue={displayUser?.jobPosition || ""} key={`job-${displayUser?.jobPosition}`}
                readOnly={!isEditing || !canEditTopSection}
                className={editableClass(canEditTopSection)}
              />
            </div>
            <div>
              <label className="text-sm text-on-surface-variant font-medium">Location</label>
              <input
                type="text" data-field="location"
                defaultValue={displayUser?.location || ""} key={`loc-${displayUser?.location}`}
                readOnly={!isEditing || !canEditTopSection}
                className={editableClass(canEditTopSection)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="resume" className="w-full mt-6">
        <TabsList className="w-full justify-start border-b border-outline-variant/30 rounded-none bg-transparent h-auto p-0 gap-6">
          <TabsTrigger value="resume" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface cursor-pointer">
            Resume
          </TabsTrigger>
          <TabsTrigger value="private-info" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface cursor-pointer">
            Private Info
          </TabsTrigger>
          <TabsTrigger value="salary-info" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface disabled:opacity-30 cursor-pointer">
            Salary Info
          </TabsTrigger>
          <TabsTrigger value="security" disabled={isViewingOther} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-container rounded-none pb-3 pt-2 px-1 text-base text-on-surface-variant data-[state=active]:text-on-surface disabled:opacity-30">
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
                    readOnly={!isEditing} data-field="about"
                    defaultValue={displayUser?.about || ""} key={`about-${displayUser?.about}`}
                    className={`min-h-[120px] resize-none ${isEditing ? "border-transparent hover:border-outline-variant/30 focus:border-primary-container bg-transparent text-on-surface" : "border-transparent bg-transparent shadow-none px-0 text-on-surface-variant focus-visible:ring-0 focus-visible:ring-offset-0"}`}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className={`group relative border ${isEditing ? "border-outline-variant/30 hover:border-primary-container/50 bg-surface-container-low/30" : "border-transparent"} p-5 rounded-lg transition-colors`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-h3 text-xl font-bold text-on-surface">What I love about my job</h3>
                    {isEditing && <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">edit</span>}
                  </div>
                  <Textarea
                    readOnly={!isEditing} data-field="whatILove"
                    defaultValue={displayUser?.whatILove || ""} key={`love-${displayUser?.whatILove}`}
                    className={`min-h-[120px] resize-none ${isEditing ? "border-transparent hover:border-outline-variant/30 focus:border-primary-container bg-transparent text-on-surface" : "border-transparent bg-transparent shadow-none px-0 text-on-surface-variant focus-visible:ring-0 focus-visible:ring-offset-0"}`}
                    placeholder="Share what you love about your job..."
                  />
                </div>

                <div className={`group relative border ${isEditing ? "border-outline-variant/30 hover:border-primary-container/50 bg-surface-container-low/30" : "border-transparent"} p-5 rounded-lg transition-colors`}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-h3 text-xl font-bold text-on-surface">My interests and hobbies</h3>
                    {isEditing && <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">edit</span>}
                  </div>
                  <Textarea
                    readOnly={!isEditing} data-field="interests"
                    defaultValue={displayUser?.interests || ""} key={`interests-${displayUser?.interests}`}
                    className={`min-h-[120px] resize-none ${isEditing ? "border-transparent hover:border-outline-variant/30 focus:border-primary-container bg-transparent text-on-surface" : "border-transparent bg-transparent shadow-none px-0 text-on-surface-variant focus-visible:ring-0 focus-visible:ring-offset-0"}`}
                    placeholder="Share your interests and hobbies..."
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8 pl-0 lg:pl-4">
                <div className="border border-outline-variant/30 p-5 rounded-lg bg-surface-container-low/30">
                  <h3 className="font-h3 text-xl font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2">Skills</h3>
                  <div className="min-h-[120px]">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(displayUser?.skills && displayUser.skills.length > 0) ? (
                        displayUser.skills.map((skill) => (
                          <span key={skill.id} className="px-3 py-1 bg-[#A463B0]/10 text-[#A463B0] rounded-full text-sm font-medium border border-[#A463B0]/20 inline-flex items-center gap-1.5">
                            {skill.name}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await fetch(`/api/user/skills?id=${skill.id}`, { method: "DELETE" });
                                  if (isViewingOther && targetUserId) {
                                    const res = await fetch(`/api/user/${targetUserId}`);
                                    const data = await res.json();
                                    if (data.user) setTargetUser(data.user);
                                  } else {
                                    await refreshUser();
                                  }
                                }}
                                className="hover:text-red-500 transition-colors"
                                title="Remove skill"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <p className="text-on-surface-variant text-sm italic">No skills added yet.</p>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        id="skill-input"
                        placeholder="e.g. React, TypeScript, Node.js"
                        className="flex-1 px-3 py-1.5 text-sm border border-outline-variant/30 rounded-md bg-surface-container-low focus:outline-none focus:border-primary-container text-on-surface"
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const val = input.value.trim();
                            if (!val) return;
                            input.disabled = true;
                            await fetch("/api/user/skills", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ skills: val, userId: isViewingOther ? targetUserId : undefined }),
                            });
                            input.value = "";
                            input.disabled = false;
                            if (isViewingOther && targetUserId) {
                              const res = await fetch(`/api/user/${targetUserId}`);
                              const data = await res.json();
                              if (data.user) setTargetUser(data.user);
                            } else {
                              await refreshUser();
                            }
                            input.focus();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const input = document.getElementById("skill-input") as HTMLInputElement;
                          const val = input?.value?.trim();
                          if (!val) return;
                          input.disabled = true;
                          await fetch("/api/user/skills", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ skills: val, userId: isViewingOther ? targetUserId : undefined }),
                          });
                          input.value = "";
                          input.disabled = false;
                          if (isViewingOther && targetUserId) {
                            const res = await fetch(`/api/user/${targetUserId}`);
                            const data = await res.json();
                            if (data.user) setTargetUser(data.user);
                          } else {
                            await refreshUser();
                          }
                          input.focus();
                        }}
                        className="px-3 py-1.5 bg-[#A463B0] text-white rounded-md text-sm font-medium hover:bg-[#8A5294] transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span> Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-outline-variant/30 p-5 rounded-lg bg-surface-container-low/30">
                  <h3 className="font-h3 text-xl font-bold text-on-surface mb-4 border-b border-outline-variant/30 pb-2">Certification</h3>
                  <div className="min-h-[120px]">
                    <div className="space-y-3 mb-4">
                      {(displayUser?.certifications && displayUser.certifications.length > 0) ? (
                        displayUser.certifications.map((cert) => (
                          <div key={cert.id} className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-md border border-outline-variant/20 shadow-sm">
                            <div>
                              <p className="font-semibold text-on-surface text-sm">{cert.name}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">{cert.issuer || "—"}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">{cert.year || "—"}</span>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await fetch(`/api/user/certifications?id=${cert.id}`, { method: "DELETE" });
                                    if (isViewingOther && targetUserId) {
                                      const res = await fetch(`/api/user/${targetUserId}`);
                                      const data = await res.json();
                                      if (data.user) setTargetUser(data.user);
                                    } else {
                                      await refreshUser();
                                    }
                                  }}
                                  className="text-outline hover:text-red-500 transition-colors"
                                  title="Remove certification"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-on-surface-variant text-sm italic">No certifications added yet.</p>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex flex-col gap-2 border-t border-outline-variant/30 pt-3">
                      <div className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          id="cert-name"
                          placeholder="Name (e.g. AWS Certified)"
                          className="col-span-12 sm:col-span-5 px-3 py-1.5 text-sm border border-outline-variant/30 rounded-md bg-surface-container-low focus:outline-none focus:border-primary-container text-on-surface"
                        />
                        <input
                          type="text"
                          id="cert-issuer"
                          placeholder="Issuer (Optional)"
                          className="col-span-8 sm:col-span-4 px-3 py-1.5 text-sm border border-outline-variant/30 rounded-md bg-surface-container-low focus:outline-none focus:border-primary-container text-on-surface"
                        />
                        <input
                          type="number"
                          id="cert-year"
                          placeholder="Year"
                          className="col-span-4 sm:col-span-3 px-3 py-1.5 text-sm border border-outline-variant/30 rounded-md bg-surface-container-low focus:outline-none focus:border-primary-container text-on-surface"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const nameInput = document.getElementById("cert-name") as HTMLInputElement;
                          const issuerInput = document.getElementById("cert-issuer") as HTMLInputElement;
                          const yearInput = document.getElementById("cert-year") as HTMLInputElement;

                          const name = nameInput?.value?.trim();
                          const issuer = issuerInput?.value?.trim();
                          const year = yearInput?.value?.trim();

                          if (!name) return;

                          nameInput.disabled = true;
                          issuerInput.disabled = true;
                          yearInput.disabled = true;

                          await fetch("/api/user/certifications", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name,
                              issuer: issuer || undefined,
                              year: year || undefined,
                              userId: isViewingOther ? targetUserId : undefined
                            }),
                          });

                          nameInput.value = "";
                          issuerInput.value = "";
                          yearInput.value = "";

                          nameInput.disabled = false;
                          issuerInput.disabled = false;
                          yearInput.disabled = false;

                          if (isViewingOther && targetUserId) {
                            const res = await fetch(`/api/user/${targetUserId}`);
                            const data = await res.json();
                            if (data.user) setTargetUser(data.user);
                          } else {
                            await refreshUser();
                          }
                        }}
                        className="self-end px-3 py-1.5 mt-1 bg-[#A463B0] text-white rounded-md text-sm font-medium hover:bg-[#8A5294] transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span> Add Cert
                      </button>
                    </div>
                  )}
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
                  <Input readOnly={!isEditing} data-field="dateOfBirth" type={isEditing ? "date" : "text"} className={privateFieldClass} defaultValue={displayUser?.dateOfBirth ? new Date(displayUser.dateOfBirth).toISOString().split('T')[0] : ""} key={`dob-${displayUser?.dateOfBirth}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Residing Address</label>
                  <Input readOnly={!isEditing} data-field="residingAddress" type="text" className={privateFieldClass} defaultValue={displayUser?.residingAddress || ""} key={`addr-${displayUser?.residingAddress}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Nationality</label>
                  <Input readOnly={!isEditing} data-field="nationality" type="text" className={privateFieldClass} defaultValue={displayUser?.nationality || ""} key={`nat-${displayUser?.nationality}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Personal Email</label>
                  <Input readOnly={!isEditing} data-field="personalEmail" type="email" className={privateFieldClass} defaultValue={displayUser?.personalEmail || ""} key={`pemail-${displayUser?.personalEmail}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Gender</label>
                  <Input readOnly={!isEditing} data-field="gender" type="text" className={privateFieldClass} defaultValue={displayUser?.gender || ""} key={`gender-${displayUser?.gender}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Marital Status</label>
                  <Input readOnly={!isEditing} data-field="maritalStatus" type="text" className={privateFieldClass} defaultValue={displayUser?.maritalStatus || ""} key={`marital-${displayUser?.maritalStatus}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Date of Joining</label>
                  <Input readOnly={!isEditing} data-field="dateOfJoining" type={isEditing ? "date" : "text"} className={privateFieldClass} defaultValue={displayUser?.dateOfJoining ? new Date(displayUser.dateOfJoining).toISOString().split('T')[0] : ""} key={`doj-${displayUser?.dateOfJoining}`} />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-h3 text-xl font-bold text-on-surface border-b border-outline-variant/30 pb-2 mb-4">Bank Details</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Account Number</label>
                  <Input readOnly={!isEditing} data-field="accountNumber" data-group="bank" type="text" className={privateFieldClass} defaultValue={displayUser?.bankDetails?.accountNumber || ""} key={`ban-${displayUser?.bankDetails?.accountNumber}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Bank Name</label>
                  <Input readOnly={!isEditing} data-field="bankName" data-group="bank" type="text" className={privateFieldClass} defaultValue={displayUser?.bankDetails?.bankName || ""} key={`bname-${displayUser?.bankDetails?.bankName}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">IFSC Code</label>
                  <Input readOnly={!isEditing} data-field="ifscCode" data-group="bank" type="text" className={privateFieldClass} defaultValue={displayUser?.bankDetails?.ifscCode || ""} key={`ifsc-${displayUser?.bankDetails?.ifscCode}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">PAN No</label>
                  <Input readOnly={!isEditing} data-field="panNumber" data-group="bank" type="text" className={privateFieldClass} defaultValue={displayUser?.bankDetails?.panNumber || ""} key={`pan-${displayUser?.bankDetails?.panNumber}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">UAN NO</label>
                  <Input readOnly={!isEditing} data-field="uanNumber" data-group="bank" type="text" className={privateFieldClass} defaultValue={displayUser?.bankDetails?.uanNumber || ""} key={`uan-${displayUser?.bankDetails?.uanNumber}`} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="w-40 text-on-surface-variant font-medium text-sm">Emp Code</label>
                  <Input readOnly={!isEditing} data-field="employeeCode" data-group="bank" type="text" className={privateFieldClass} defaultValue={displayUser?.bankDetails?.employeeCode || ""} key={`empcode-${displayUser?.bankDetails?.employeeCode}`} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Salary Info Tab */}
          <TabsContent value="salary-info" className="outline-none">
            {canViewSalaryAndSecurity ? (
              <SalaryInfoTab
                userId={displayUser?.id ?? ""}
                canEdit={canEditSalary}
              />
            ) : <div>
              You are not authorized to view this content.
            </div>
            }
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="outline-none">
            <div className="w-full p-8 sm:p-12 border border-outline-variant/30 rounded-xl text-center bg-surface-container-low/30 flex flex-col items-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">lock</span>
              <h3 className="text-xl font-medium text-on-surface mb-2">Security Settings</h3>
              <p className="text-on-surface-variant mb-8">Manage your password and security credentials.</p>

              <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-lg w-full max-w-[450px] text-left shadow-sm shrink-0">
                <h4 className="font-semibold text-lg mb-2 text-on-surface">Password Management</h4>

                {isAdmin ? (
                  /* ── Admin: email-based reset link ── */
                  <>
                    <p className="text-sm text-on-surface-variant mb-6">Receive a secure link via email to change your password. The link will be valid for 2 hours.</p>
                    <Button
                      onClick={handleRequestPasswordChange}
                      disabled={requestingPassword}
                      className="bg-on-surface hover:bg-inverse-surface text-on-primary w-full"
                    >
                      {requestingPassword ? "Sending link..." : "Send Reset Link"}
                    </Button>
                  </>
                ) : (
                  /* ── Non-Admin: direct new / confirm password fields ── */
                  <>
                    <p className="text-sm text-on-surface-variant mb-6">Enter a new password below to update your account password.</p>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-on-surface-variant">New Password</label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="pr-10"
                          />
                          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface" onClick={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-on-surface-variant">Confirm Password</label>
                        <div className="relative">
                          <Input
                            type={showConfirmNewPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="pr-10"
                          />
                          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                            {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={async () => {
                        setChangingPassword(true);
                        try {
                          const result = await changePasswordDirect(newPassword, confirmPassword);
                          if (result.success) {
                            toast.success("Password changed successfully!");
                            setNewPassword("");
                            setConfirmPassword("");
                          } else {
                            toast.error(result.error || "Failed to change password.");
                          }
                        } catch {
                          toast.error("An unexpected error occurred.");
                        } finally {
                          setChangingPassword(false);
                        }
                      }}
                      disabled={changingPassword || !newPassword || !confirmPassword}
                      className="bg-on-surface hover:bg-inverse-surface text-on-primary w-full mt-6"
                    >
                      {changingPassword ? "Saving..." : "Save New Password"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
