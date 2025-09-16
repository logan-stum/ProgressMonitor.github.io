import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function App() {
  const [dataSets, setDataSets] = useState([
    {
      name: "Set 1",
      charts: [
        {
          name: "Chart 1",
          start: { value: 0, date: new Date().toISOString().split("T")[0] },
          goal: { value: 100, date: new Date().toISOString().split("T")[0] },
          data: [],
          notes: "",
        },
      ],
    },
  ]);

  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const [newPoint, setNewPoint] = useState({ value: "", date: "" });

  const activeSet = dataSets[activeSetIndex];
  const activeChart = activeSet?.charts[activeChartIndex];

  // Add point
  const addPoint = () => {
    if (!newPoint.value || !newPoint.date) return;
    const updated = [...dataSets];
    updated[activeSetIndex].charts[activeChartIndex].data.push({
      x: newPoint.date,
      y: Number(newPoint.value),
    });
    setDataSets(updated);
    setNewPoint({ value: "", date: "" });
  };

  // Hover delete
  const handlePointClick = (evt, elements) => {
    if (!elements.length) return;
    const idx = elements[0].index;
    const updated = [...dataSets];
    updated[activeSetIndex].charts[activeChartIndex].data.splice(idx, 1);
    setDataSets(updated);
  };

  if (!activeChart) return <div>No chart selected</div>;

  const chartData = {
    datasets: [
      {
        label: "Progress",
        data: activeChart.data,
        borderColor: "cyan",
        backgroundColor: "cyan",
      },
      {
        label: "Start",
        data: [{ x: activeChart.start.date, y: activeChart.start.value }],
        borderColor: "green",
        backgroundColor: "green",
        pointRadius: 6,
      },
      {
        label: "Goal",
        data: [{ x: activeChart.goal.date, y: activeChart.goal.value }],
        borderColor: "orange",
        backgroundColor: "orange",
        pointRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // 🔑 allow container control
    onClick: handlePointClick,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day" },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div
      style={{
        background: "#222",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h1 style={{ display: "flex", alignItems: "center" }}>
        <img
          src="https://img.icons8.com/color/48/combo-chart--v1.png"
          alt="logo"
          style={{ marginRight: 10 }}
        />
        Progress Monitor
      </h1>

      {/* Chart area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#111",
            borderRadius: 8,
            padding: 10,
            width: "100%",        // fill horizontally
            maxWidth: "100%",     // never exceed page
            height: "60vh",       // 🔑 cap chart height to 60% of viewport
          }}
        >
          <Line data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
        </div>

        {/* Inputs below */}
        <div style={{ marginTop: 15 }}>
          <label>
            Value:
            <input
              type="number"
              value={newPoint.value}
              onChange={(e) => setNewPoint({ ...newPoint, value: e.target.value })}
              style={{ margin: "0 10px" }}
            />
          </label>
          <label>
            Date:
            <input
              type="date"
              value={newPoint.date}
              onChange={(e) => setNewPoint({ ...newPoint, date: e.target.value })}
              style={{ margin: "0 10px" }}
            />
          </label>
          <button onClick={addPoint}>+ Add</button>
        </div>

        <textarea
          value={activeChart.notes}
          onChange={(e) => {
            const updated = [...dataSets];
            updated[activeSetIndex].charts[activeChartIndex].notes = e.target.value;
            setDataSets(updated);
          }}
          placeholder="Add notes here..."
          style={{
            marginTop: 15,
            width: "100%",
            minHeight: 80,
            resize: "vertical",
          }}
        />
      </div>
    </div>
  );
}

export default App;
