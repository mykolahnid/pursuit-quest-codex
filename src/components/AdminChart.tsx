"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type AdminChartProps = {
  labels: string[];
  answer1Values: number[];
  answer2Values: number[];
};

export function AdminChart({ labels, answer1Values, answer2Values }: AdminChartProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Answer 1 (1-100)",
            data: answer1Values,
            borderColor: "#1f8a70",
            backgroundColor: "rgba(31, 138, 112, 0.15)",
            pointRadius: 3,
            tension: 0.25,
          },
          {
            label: "Answer 2 (0-100)",
            data: answer2Values,
            borderColor: "#b54708",
            backgroundColor: "rgba(181, 71, 8, 0.12)",
            pointRadius: 3,
            tension: 0.25,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: { display: false },
        },
        scales: {
          x: {
            title: { display: true, text: "Person" },
          },
          y: {
            title: { display: true, text: "Answer Value" },
          },
        },
      }}
    />
  );
}
