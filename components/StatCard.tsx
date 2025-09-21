import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-md flex items-center justify-between mobile-spacing">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{value}</p>
      </div>
      <div className="p-2 sm:p-3 flex-shrink-0">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;