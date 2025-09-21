import React from 'react';

interface Dataset {
    label: string;
    data: number[];
    color: string;
}

interface LineChartData {
    labels: string[];
    datasets: Dataset[];
}

interface LineChartProps {
    data: LineChartData;
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
    if (!data || data.datasets.every(ds => ds.data.every(d => d === 0))) {
        return <p className="text-center text-slate-500 py-8">No hay suficientes datos para mostrar la tendencia.</p>;
    }
    
    const width = 500;
    const height = 300;
    const padding = 40;

    const allDataPoints = data.datasets.flatMap(ds => ds.data);
    const yMax = Math.max(...allDataPoints, 0);

    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (data.labels.length - 1);
    const getY = (value: number) => height - padding - (value / yMax) * (height - 2 * padding);

    return (
        <div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-Axis lines and labels */}
                {[...Array(5)].map((_, i) => {
                    const y = height - padding - (i * (height - 2 * padding) / 4);
                    const value = (i * yMax / 4);
                    return (
                        <g key={i}>
                            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                            <text x={padding - 10} y={y + 3} textAnchor="end" fontSize="10" fill="#64748b">
                                ${value.toLocaleString(undefined, {notation: 'compact'})}
                            </text>
                        </g>
                    )
                })}

                {/* X-Axis labels */}
                {data.labels.map((label, i) => (
                    <text key={i} x={getX(i)} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#64748b">
                        {label}
                    </text>
                ))}

                {/* Data lines */}
                {data.datasets.map(dataset => {
                    const path = dataset.data
                        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point)}`)
                        .join(' ');
                    
                    return (
                        <path key={dataset.label} d={path} fill="none" stroke={dataset.color} strokeWidth="2" />
                    );
                })}
            </svg>
            <div className="flex justify-center space-x-4 mt-2">
                {data.datasets.map(dataset => (
                    <div key={dataset.label} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: dataset.color }}></span>
                        <span>{dataset.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LineChart;
