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
  const [theme, setTheme] = useState("dark"); // added theme state

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

  // --- theme styles ---
  const themeStyles = theme === "dark"
    ? { background: "#222", color: "white" }
    : { background: "#eee", color: "#222" };
  const sidebarStyles = theme === "dark" ? { background: "#111" } : { background: "#ddd" };
  const mainStyles = theme === "dark" ? { background: "#222" } : { background: "#fff" };

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
    <div style={{ display: "flex", height: "100vh", width: "100vw", ...themeStyles }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 250 : 50,
          ...sidebarStyles,
          transition: "width 0.3s",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            marginBottom: 10,
            background: "transparent",
            color: theme === "dark" ? "white" : "#222",
            border: "none",
            cursor: "pointer",
            fontSize: 24,
          }}
        >
          ☰
        </button>
        {/* Theme toggle */}
        {sidebarOpen && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              marginBottom: 10,
              background: "transparent",
              color: theme === "dark" ? "white" : "#222",
              border: "1px solid",
              borderRadius: 4,
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            Toggle {theme === "dark" ? "Light" : "Dark"}
          </button>
        )}

        {/* Sidebar list and add set button */}
        {/* Keep your existing sidebar content here unchanged */}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", minHeight: 0, ...mainStyles }}>
        {/* Keep all existing main content here, inputs, chart, notes, unchanged */}
      </div>
    </div>
  );
}

export default App;