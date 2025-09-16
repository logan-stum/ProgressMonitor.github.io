import React, { useState, useRef } from "react";
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
  const [sets, setSets] = useState([
    {
      name: "Set 1",
      charts: [
        {
          name: "Chart 1",
          startValue: 0,
          startDate: new Date().toISOString().split("T")[0],
          goalValue: 100,
          goalDate: new Date().toISOString().split("T")[0],
          notes: "",
          data: [],
        },
      ],
    },
  ]);
  const [activeSet, setActiveSet] = useState(0);
  const [activeChart, setActiveChart] = useState(0);
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState("");
  const chartRef = useRef(null);

  const addSet = () => {
    setSets([
      ...sets,
      {
        name: `Set ${sets.length + 1}`,
        charts: [],
      },
    ]);
    setActiveSet(sets.length);
    setActiveChart(0);
  };

  const addChart = () => {
    const updated = [...sets];
    updated[activeSet].charts.push({
      name: `Chart ${updated[activeSet].charts.length + 1}`,
      startValue: 0,
      startDate: new Date().toISOString().split("T")[0],
      goalValue: 100,
      goalDate: new Date().toISOString().split("T")[0],
      notes: "",
      data: [],
    });
    setSets(updated);
    setActiveChart(updated[activeSet].charts.length - 1);
  };

  const renameSet = (index, newName) => {
    const updated = [...sets];
    updated[index].name = newName;
    setSets(updated);
  };

  const renameChart = (index, newName) => {
    const updated = [...sets];
    updated[activeSet].charts[index].name = newName;
    setSets(updated);
  };

  const removeSet = (index) => {
    const updated = sets.filter((_, i) => i !== index);
    setSets(updated);
    setActiveSet(0);
    setActiveChart(0);
  };

  const removeChart = (index) => {
    const updated = [...sets];
    updated[activeSet].charts = updated[activeSet].charts.filter(
      (_, i) => i !== index
    );
    setSets(updated);
    setActiveChart(0);
  };

  const addPoint = () => {
    if (!newValue) return;
    const updated = [...sets];
    const chart = updated[activeSet].charts[activeChart];
    chart.data.push({
      x: newDate || new Date().toISOString().split("T")[0],
      y: Number(newValue),
    });
    setSets(updated);
    setNewValue("");
    setNewDate("");
  };

  const handlePointClick = (event) => {
    const chart = chartRef.current;
    if (!chart) return;
    const points = chart.getElementsAtEventForMode(
      event.nativeEvent,
      "nearest",
      { intersect: true },
      false
    );
    if (points.length) {
      const index = points[0].index;
      if (window.confirm("Remove this point?")) {
        const updated = [...sets];
        updated[activeSet].charts[activeChart].data.splice(index, 1);
        setSets(updated);
      }
    }
  };

  if (!sets[activeSet] || !sets[activeSet].charts[activeChart]) {
    return (
      <div style={{ height: "100vh", background: "#222", color: "white" }}>
        <h2 style={{ padding: 20 }}>No charts available. Add one to begin.</h2>
      </div>
    );
  }

  const chart = sets[activeSet].charts[activeChart];
  const chartData = {
    datasets: [
      {
        label: chart.name,
        data: [
          { x: chart.startDate, y: chart.startValue },
          ...chart.data,
          { x: chart.goalDate, y: chart.goalValue },
        ],
        borderColor: "cyan",
        backgroundColor: "cyan",
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handlePointClick,
    plugins: { legend: { position: "top" } },
    scales: {
      x: {
        type: "time",
        time: { unit: "day" },
      },
      y: { beginAtZero: true },
    },
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        margin: 0,
        background: "#222",
        color: "white",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#111",
          padding: "10px",
          overflowY: "auto",
        }}
      >
        <h2>Data Sets</h2>
        {sets.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <button
              onClick={() => setActiveSet(i)}
              onDoubleClick={() => {
                const newName = prompt("Rename set:", s.name);
                if (newName) renameSet(i, newName);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "6px",
                marginBottom: "5px",
                background: activeSet === i ? "#444" : "#000",
                color: "white",
                border: "1px solid white",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {s.name}
            </button>
            <button
              onClick={() => removeSet(i)}
              style={{
                padding: "4px 8px",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addSet}
          style={{
            padding: "6px 12px",
            background: "#111",
            color: "white",
            border: "1px solid white",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          + Add Set
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          overflow: "hidden",
        }}
      >
        <h1>{sets[activeSet].name}</h1>
        <div style={{ marginBottom: 20 }}>
          {sets[activeSet].charts.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveChart(i)}
              onDoubleClick={() => {
                const newName = prompt("Rename chart:", c.name);
                if (newName) renameChart(i, newName);
              }}
              style={{
                padding: "6px 12px",
                marginRight: "5px",
                background: activeChart === i ? "#444" : "#000",
                color: "white",
                border: "1px solid white",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={addChart}
            style={{
              padding: "6px 12px",
              background: "#111",
              color: "white",
              border: "1px solid white",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            + Add Chart
          </button>
          {sets[activeSet].charts.length > 0 && (
            <button
              onClick={() => removeChart(activeChart)}
              style={{
                padding: "6px 12px",
                marginLeft: "10px",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Remove Chart
            </button>
          )}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, minHeight: 0, background: "#111", borderRadius: 8 }}>
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>

        {/* Controls */}
        <div style={{ marginTop: 10 }}>
          <label>
            Value:
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              style={{ margin: "0 10px" }}
            />
          </label>
          <label>
            Date:
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              style={{ margin: "0 10px" }}
            />
          </label>
          <button onClick={addPoint}>+ Add Point</button>
        </div>

        {/* Notes box */}
        <textarea
          value={chart.notes}
          onChange={(e) => {
            const updated = [...sets];
            updated[activeSet].charts[activeChart].notes = e.target.value;
            setSets(updated);
          }}
          placeholder="Add notes..."
          style={{
            marginTop: "10px",
            width: "100%",
            minHeight: "60px",
            padding: "10px",
            borderRadius: "6px",
          }}
        />
      </div>
    </div>
  );
}

export default App;
