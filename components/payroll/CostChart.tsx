"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface ChartDataPoint {
  label: string;
  employerCost: number;
  employeeCount: number;
}

interface CostChartProps {
  data: ChartDataPoint[];
  mode: "employerCost" | "employeeCount";
  title: string;
}

export function CostChart({ data, mode, title }: CostChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart instance to avoid canvas reuse error
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = data.map((d) => d.label);
    const values = data.map((d) => (mode === "employerCost" ? d.employerCost : d.employeeCount));

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: mode === "employerCost" ? "Employer Cost (₹)" : "Employee Count",
            data: values,
            backgroundColor: "rgba(147, 197, 253, 0.7)", // Tailwind blue-200
            borderColor: "rgba(59, 130, 246, 0.9)",       // Tailwind blue-500
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                mode === "employerCost"
                  ? `₹${(ctx.parsed.y ?? 0).toLocaleString("en-IN")}`
                  : `${ctx.parsed.y} employees`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) =>
                mode === "employerCost"
                  ? `₹${Number(val).toLocaleString("en-IN")}`
                  : String(val),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [data, mode]);

  return (
    <div className="h-48">
      <canvas ref={canvasRef} />
    </div>
  );
}