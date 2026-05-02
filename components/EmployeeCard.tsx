import React from 'react';

export type EmployeeStatus = 'present' | 'leave' | 'absent';

interface EmployeeCardProps {
  name: string;
  role: string;
  status: EmployeeStatus;
  avatarUrl?: string;
}

export default function EmployeeCard({ name, role, status, avatarUrl }: EmployeeCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'present':
        return <div className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" title="Present" />;
      case 'leave':
        return <span className="material-symbols-outlined text-blue-500 text-lg drop-shadow-sm" title="On Leave">flight</span>;
      case 'absent':
        return <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-white shadow-sm" title="Absent" />;
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 flex flex-col items-center shadow-sm hover:shadow-[0_8px_30px_rgba(113,75,103,0.08)] transition-all relative group">
      <div className="absolute top-4 right-4">
        {getStatusIcon()}
      </div>
      
      <div className="w-24 h-24 rounded-2xl bg-secondary-container/20 text-on-secondary-container flex items-center justify-center mb-4 overflow-hidden border border-outline-variant/20 group-hover:scale-105 transition-transform">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-5xl opacity-50">person</span>
        )}
      </div>
      
      <h3 className="font-h3 text-lg text-on-surface mb-1 text-center truncate w-full">{name}</h3>
      <p className="font-body-md text-sm text-on-surface-variant text-center truncate w-full">{role}</p>
    </div>
  );
}
