"use client";

import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const data = [
    { name: 'Mon', total: 150 },
    { name: 'Tue', total: 230 },
    { name: 'Wed', total: 180 },
    { name: 'Thu', total: 290 },
    { name: 'Fri', total: 200 },
    { name: 'Sat', total: 380 },
    { name: 'Sun', total: 310 },
];

export function RevenueChart() {
    return (
        <div className="h-[80px] w-[180px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl text-[10px]">
                                        <span className="text-amber-500 font-bold">{payload[0].value}€</span>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        fill="url(#colorTotal)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
