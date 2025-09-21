import React from 'react';

interface BarChartData {
    label: string;
    value: number;
    icon: string;
}

interface BarChartProps {
    data: BarChartData[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="text-center text-slate-500 py-8">No hay datos de gastos para mostrar.</p>;
    }

    const maxValue = Math.max(...data.map(item => item.value), 0);

    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <div key={index} className="group">
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium text-slate-700 flex items-center">
                           <span className="text-lg mr-2">{item.icon}</span> {item.label}
                        </span>
                        <span className="font-bold text-slate-800">${item.value.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                            className="bg-indigo-500 h-2.5 rounded-full group-hover:bg-indigo-600 transition-colors"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BarChart;
