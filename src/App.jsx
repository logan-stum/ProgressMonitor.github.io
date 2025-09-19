import React, { useState, useEffect, useRef } from "react";
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
  const chartRef = useRef(null);
  const [masterSets, setMasterSets] = useState([
    {
      name: "Set 1",
      charts: [
        {
          name: "Chart 1",
          startValue: 20,
          startDate: new Date().toISOString().split("T")[0],
          goalValue: 80,
          goalDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
            .toISOString()
            .split("T")[0],
          data: [],
          notes: "",
        },
      ],
    },
  ]);

  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("progressData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMasterSets(parsed);
      } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("progressData", JSON.stringify(masterSets));
  }, [masterSets]);

  const activeSet = masterSets[activeSetIndex];
  const activeChart = activeSet.charts[activeChartIndex];

  // --- Master Set functions ---
  const addMasterSet = () => {
    const newSet = {
      name: `Set ${masterSets.length + 1}`,
      charts: [
        {
          name: "Chart 1",
          startValue: 20,
          startDate: new Date().toISOString().split("T")[0],
          goalValue: 80,
          goalDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
            .toISOString()
            .split("T")[0],
          data: [],
          notes: "",
        },
      ],
    };
    setMasterSets([...masterSets, newSet]);
    setActiveSetIndex(masterSets.length);
    setActiveChartIndex(0);
  };

  const renameMasterSet = (index) => {
    const newName = prompt("Rename Master Set:", masterSets[index].name);
    if (!newName) return;
    const updated = [...masterSets];
    updated[index].name = newName;
    setMasterSets(updated);
  };

  const deleteMasterSet = (index) => {
    if (!window.confirm(`Delete Master Set "${masterSets[index].name}"?`))
      return;
    const updated = masterSets.filter((_, idx) => idx !== index);
    setMasterSets(
      updated.length
        ? updated
        : [
            {
              name: "Set 1",
              charts: [
                {
                  name: "Chart 1",
                  startValue: 20,
                  startDate: new Date().toISOString().split("T")[0],
                  goalValue: 80,
                  goalDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
                    .toISOString()
                    .split("T")[0],
                  data: [],
                  notes: "",
                },
              ],
            },
          ]
    );
    setActiveSetIndex(0);
    setActiveChartIndex(0);
  };

  // --- Chart functions ---
  const addChartToSet = (setIndex) => {
    const updated = [...masterSets];
    const newChart = {
      name: `Chart ${updated[setIndex].charts.length + 1}`,
      startValue: 20,
      startDate: new Date().toISOString().split("T")[0],
      goalValue: 80,
      goalDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
        .toISOString()
        .split("T")[0],
      data: [],
      notes: "",
    };
    updated[setIndex].charts.push(newChart);
    setMasterSets(updated);
    setActiveSetIndex(setIndex);
    setActiveChartIndex(updated[setIndex].charts.length - 1);
  };

  const renameChart = (setIndex, chartIndex) => {
    const newName = prompt(
      "Rename Chart:",
      masterSets[setIndex].charts[chartIndex].name
    );
    if (!newName) return;
    const updated = [...masterSets];
    updated[setIndex].charts[chartIndex].name = newName;
    setMasterSets(updated);
  };

  const deleteChart = (setIndex, chartIndex) => {
    if (
      !window.confirm(
        `Delete Chart "${masterSets[setIndex].charts[chartIndex].name}"?`
      )
    )
      return;
    const updated = [...masterSets];
    updated[setIndex].charts.splice(chartIndex, 1);
    if (!updated[setIndex].charts.length) {
      updated[setIndex].charts.push({
        name: "Chart 1",
        startValue: 20,
        startDate: new Date().toISOString().split("T")[0],
        goalValue: 80,
        goalDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
          .toISOString()
          .split("T")[0],
        data: [],
        notes: "",
      });
    }
    setMasterSets(updated);
    setActiveChartIndex(0);
  };

  // --- Data point functions ---
  const addPoint = () => {
    if (!newValue || !newDate) return;
    const updated = [...masterSets];
    updated[activeSetIndex].charts[activeChartIndex].data.push({
      date: newDate,
      value: Number(newValue),
    });
    setMasterSets(updated);
    setNewValue("");
    setNewDate(new Date().toISOString().split("T")[0]);
  };

  const removePoint = (index) => {
    const updated = [...masterSets];
    updated[activeSetIndex].charts[activeChartIndex].data.splice(index, 1);
    setMasterSets(updated);
    setHoveredPoint(null);
  };

  // --- JSON import/export ---
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(masterSets, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progress_data.json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (
          Array.isArray(data) &&
          data.every((set) => set.name && Array.isArray(set.charts))
        ) {
          setMasterSets(data);
          setActiveSetIndex(0);
          setActiveChartIndex(0);
        } else alert("Invalid JSON structure.");
      } catch {
        alert("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  // --- Chart.js data ---
  const chartData = {
    datasets: [
      {
        label: "Progress",
        data: activeChart.data.map((d) => ({ x: d.date, y: d.value })),
        borderColor: "cyan",
        backgroundColor: "cyan",
        tension: 0.3,
        fill: false,
        pointRadius: 5,
      },
      {
        label: "Start → Goal",
        data: [
          { x: activeChart.startDate, y: activeChart.startValue },
          { x: activeChart.goalDate, y: activeChart.goalValue },
        ],
        borderColor: "green",
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { type: "time", time: { unit: "day", tooltipFormat: "yyyy-MM-dd" } },
      y: {
        beginAtZero: true,
        suggestedMax:
          Math.max(
            activeChart.startValue,
            activeChart.goalValue,
            ...activeChart.data.map((d) => d.value)
          ) + 10,
      },
    },
    onHover: (event, elements) => {
      if (elements.length) {
        const el = elements[0];
        setHoveredPoint({
          x: el.element.x,
          y: el.element.y,
          index: el.index,
        });
      } else {
        setHoveredPoint(null);
      }
    },
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#222",
        color: "white",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 250 : 50,
          background: "#111",
          transition: "width 0.3s",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            marginBottom: 10,
            background: "transparent",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: 24,
          }}
        >
          ☰
        </button>

        {/* Scrollable sets */}
        {sidebarOpen && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 10,
            }}
          >
            {masterSets.map((set, setIdx) => (
              <div key={setIdx} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    onClick={() => {
                      setActiveSetIndex(setIdx);
                      setActiveChartIndex(0);
                    }}
                    style={{
                      cursor: "pointer",
                      fontWeight: activeSetIndex === setIdx ? "bold" : "normal",
                    }}
                  >
                    {set.name}
                  </span>
                  <div>
                    <button onClick={() => renameMasterSet(setIdx)}>✎</button>
                    <button onClick={() => deleteMasterSet(setIdx)}>🗑️</button>
                  </div>
                </div>
                <div style={{ paddingLeft: 15, marginTop: 5 }}>
                  {set.charts.map((chart, chartIdx) => (
                    <div
                      key={chartIdx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 3,
                      }}
                    >
                      <span
                        onClick={() => {
                          setActiveSetIndex(setIdx);
                          setActiveChartIndex(chartIdx);
                        }}
                        style={{
                          cursor: "pointer",
                          textDecoration:
                            activeSetIndex === setIdx &&
                            activeChartIndex === chartIdx
                              ? "underline"
                              : "none",
                        }}
                      >
                        {chart.name}
                      </span>
                      <div>
                        <button onClick={() => renameChart(setIdx, chartIdx)}>
                          ✎
                        </button>
                        <button onClick={() => deleteChart(setIdx, chartIdx)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addChartToSet(setIdx)}
                    style={{ marginTop: 3, fontSize: 12 }}
                  >
                    + Add Chart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ padding: 10, borderTop: "1px solid #333" }}>
            <button onClick={addMasterSet}>+ Add Master Set</button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
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

        {/* Start/Goal inputs */}
        <div style={{ marginBottom: 10 }}>
          <label>
            Start Value:
            <input
              type="number"
              value={activeChart.startValue}
              onChange={(e) => {
                const updated = [...masterSets];
                updated[activeSetIndex].charts[activeChartIndex].startValue =
                  Number(e.target.value);
                setMasterSets(updated);
              }}
              style={{ margin: "0 5px" }}
            />
          </label>
          <label>
            Start Date:
            <input
              type="date"
              defaultValue={activeChart.startDate}
              onBlur={(e) => {
                const val = e.target.value;
                if (!val) return;
                const updated = [...masterSets];
                updated[activeSetIndex].charts[activeChartIndex].startDate = val;
                setMasterSets(updated);
              }}
              style={{ margin: "0 5px" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>
            Goal Value:
            <input
              type="number"
              value={activeChart.goalValue}
              onChange={(e) => {
                const updated = [...masterSets];
                updated[activeSetIndex].charts[activeChartIndex].goalValue =
                  Number(e.target.value);
                setMasterSets(updated);
              }}
              style={{ margin: "0 5px" }}
            />
          </label>
          <label>
            Goal Date:
            <input
              type="date"
              defaultValue={activeChart.goalDate}
              onBlur={(e) => {
                const val = e.target.value;
                if (!val) return;
                const updated = [...masterSets];
                updated[activeSetIndex].charts[activeChartIndex].goalDate = val;
                setMasterSets(updated);
              }}
              style={{ margin: "0 5px" }}
            />
          </label>
        </div>

        {/* Add data point */}
        <div style={{ marginBottom: 10 }}>
          <label>
            Value:
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              style={{ margin: "0 5px" }}
            />
          </label>
          <label>
            Date:
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              style={{ margin: "0 5px" }}
            />
          </label>
          <button onClick={addPoint} style={{ marginLeft: 5 }}>
            + Add
          </button>
        </div>

        {/* JSON import/export */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={exportJSON} style={{ marginRight: 10 }}>
            Export JSON
          </button>
          <input type="file" accept=".json" onChange={importJSON} />
        </div>

        {/* Chart */}
        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#111",
            padding: 20,
            borderRadius: 8,
            minHeight: 0,
          }}
        >
          <Line ref={chartRef} data={chartData} options={chartOptions} />
          {hoveredPoint && (
            <button
              onClick={() => removePoint(hoveredPoint.index)}
              style={{
                position: "absolute",
                left: hoveredPoint.x,
                top: hoveredPoint.y - 20,
                transform: "translate(-50%, -100%)",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "2px 6px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              ✖
            </button>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginTop: 10 }}>
          <textarea
            value={activeChart.notes}
            onChange={(e) => {
              const updated = [...masterSets];
              updated[activeSetIndex].charts[activeChartIndex].notes =
                e.target.value;
              setMasterSets(updated);
            }}
            placeholder="Add notes..."
            style={{
              width: "100%",
              minHeight: 60,
              resize: "vertical",
              padding: 8,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
