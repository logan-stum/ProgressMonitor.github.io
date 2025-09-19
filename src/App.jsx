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
  const sidebarScrollRef = useRef(null);
  const setRefs = useRef([]);

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
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [theme, setTheme] = useState("dark"); // dark/light toggle

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("progressData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMasterSets(parsed);
      } catch {}
    }
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("progressData", JSON.stringify(masterSets));
    localStorage.setItem("theme", theme);
  }, [masterSets, theme]);

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
    const updated = [...masterSets, newSet];
    setMasterSets(updated);
    setActiveSetIndex(updated.length - 1);
    setActiveChartIndex(0);

    // Auto-scroll to the new set
    setTimeout(() => {
      const lastSetRef = setRefs.current[updated.length - 1];
      if (lastSetRef) lastSetRef.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  };

  const renameMasterSet = (index) => {
    const newName = prompt("Rename Master Set:", masterSets[index].name);
    if (!newName) return;
    const updated = [...masterSets];
    updated[index].name = newName;
    setMasterSets(updated);
  };

  const deleteMasterSet = (index) => {
    if (!window.confirm(`Delete Master Set "${masterSets[index].name}"?`)) return;
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
    if (!window.confirm(`Delete Chart "${masterSets[setIndex].charts[chartIndex].name}"?`)) return;
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
    const blob = new Blob([JSON.stringify(masterSets, null, 2)], { type: "application/json" });
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
        if (Array.isArray(data) && data.every((set) => set.name && Array.isArray(set.charts))) {
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
        borderColor: theme === "dark" ? "cyan" : "blue",
        backgroundColor: theme === "dark" ? "cyan" : "blue",
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
        suggestedMax: Math.max(
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

  // --- Theme styles ---
  const themeStyles = theme === "dark" ? { background: "#222", color: "white" } : { background: "#eee", color: "#222" };
  const sidebarStyles = theme === "dark" ? { background: "#111" } : { background: "#ddd" };
  const mainStyles = theme === "dark" ? { background: "#222" } : { background: "#fff" };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", ...themeStyles }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 250 : 50, ...sidebarStyles, transition: "width 0.3s", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginBottom: 10, background: "transparent", border: "none", cursor: "pointer", fontSize: 24, color: theme === "dark" ? "white" : "#222" }}>☰</button>
        {sidebarOpen && <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ marginBottom: 10 }}>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</button>}

        {/* Scrollable list */}
        <div ref={sidebarScrollRef} style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {sidebarOpen && masterSets.map((set, setIdx) => (
            <div key={setIdx} ref={(el) => (setRefs.current[setIdx] = el)} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span onClick={() => { setActiveSetIndex(setIdx); setActiveChartIndex(0); }} style={{ cursor: "pointer", fontWeight: activeSetIndex === setIdx ? "bold" : "normal" }}>{set.name}</span>
                <div>
                  <button onClick={() => renameMasterSet(setIdx)}>✎</button>
                  <button onClick={() => deleteMasterSet(setIdx)}>🗑️</button>
                </div>
              </div>
              <div style={{ paddingLeft: 15, marginTop: 5 }}>
                {set.charts.map((chart, chartIdx) => (
                  <div key={chartIdx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span onClick={() => { setActiveSetIndex(setIdx); setActiveChartIndex(chartIdx); }} style={{ cursor: "pointer", textDecoration: activeSetIndex === setIdx && activeChartIndex === chartIdx ? "underline" : "none" }}>{chart.name}</span>
                    <div>
                      <button onClick={() => renameChart(setIdx, chartIdx)}>✎</button>
                      <button onClick={() => deleteChart(setIdx, chartIdx)}>🗑️</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addChartToSet(setIdx)} style={{ marginTop: 3, fontSize: 12 }}>+ Add Chart</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {sidebarOpen && <div style={{ padding: 10, borderTop: `1px solid ${theme === "dark" ? "#333" : "#aaa"}` }}><button onClick={addMasterSet}>+ Add Master Set</button></div>}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", minHeight: 0, ...mainStyles }}>
        <h1 style={{ display: "flex", alignItems: "center" }}>
          <img src="https://img.icons8.com/color/48/combo-chart--v1.png" alt="logo" style={{ marginRight: 10 }} />
          Progress Monitor
        </h1>

        {/* Chart inputs */}
        {/* ... rest of your inputs and chart rendering remain unchanged ... */}
      </div>
    </div>
  );
}

export default App;
