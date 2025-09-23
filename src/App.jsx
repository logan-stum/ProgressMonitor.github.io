import React, { useState, useRef, useEffect } from "react";
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
  // State
  const [masterSets, setMasterSets] = useState(() => {
    const saved = localStorage.getItem("progressData");
    return saved ? JSON.parse(saved) : [
      {
        name: "Default Set",
        collapsed: false,
        charts: [
          {
            name: "Chart 1",
            collapsed: false,
            startValue: 0,
            startDate: "",
            goalValue: 100,
            goalDate: "",
            data: [],
            notes: "",
          },
        ],
      },
    ];
  });
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const chartRef = useRef(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("progressData", JSON.stringify(masterSets));
  }, [masterSets]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Active chart reference
  const activeChart =
    masterSets[activeSetIndex]?.charts[activeChartIndex] || null;

  // Add data point
  const addPoint = () => {
    if (!newValue || !newDate || !activeChart) return;
    const updated = [...masterSets];
    updated[activeSetIndex].charts[activeChartIndex].data.push({
      x: newDate,
      y: Number(newValue),
    });
    setMasterSets(updated);
    setNewValue("");
    setNewDate("");
  };

  // Remove data point
  const removePoint = (index) => {
    const updated = [...masterSets];
    updated[activeSetIndex].charts[activeChartIndex].data.splice(index, 1);
    setMasterSets(updated);
    setHoveredPoint(null);
  };

  // Add Master Set
  const addMasterSet = () => {
    const updated = [...masterSets, { name: "New Set", collapsed: false, charts: [] }];
    setMasterSets(updated);
    setActiveSetIndex(updated.length - 1);
    setActiveChartIndex(0);
  };

  // Add Chart
  const addChartToSet = (setIdx) => {
    const updated = [...masterSets];
    updated[setIdx].charts.push({
      name: `Chart ${updated[setIdx].charts.length + 1}`,
      collapsed: false,
      startValue: 0,
      startDate: "",
      goalValue: 100,
      goalDate: "",
      data: [],
      notes: "",
    });
    setMasterSets(updated);
    setActiveSetIndex(setIdx);
    setActiveChartIndex(updated[setIdx].charts.length - 1);
  };

  // Collapse/Expand
  const toggleSetCollapse = (setIdx) => {
    const updated = [...masterSets];
    updated[setIdx].collapsed = !updated[setIdx].collapsed;
    setMasterSets(updated);
  };

  const toggleChartCollapse = (setIdx, chartIdx) => {
    const updated = [...masterSets];
    updated[setIdx].charts[chartIdx].collapsed =
      !updated[setIdx].charts[chartIdx].collapsed;
    setMasterSets(updated);
  };

  // Rename/Delete
  const renameMasterSet = (setIdx) => {
    const newName = prompt("Enter new set name:", masterSets[setIdx].name);
    if (!newName) return;
    const updated = [...masterSets];
    updated[setIdx].name = newName;
    setMasterSets(updated);
  };

  const deleteMasterSet = (setIdx) => {
    if (!window.confirm("Delete this set?")) return;
    const updated = [...masterSets];
    updated.splice(setIdx, 1);
    setMasterSets(updated);
    setActiveSetIndex(0);
    setActiveChartIndex(0);
  };

  const renameChart = (setIdx, chartIdx) => {
    const newName = prompt("Enter new chart name:", masterSets[setIdx].charts[chartIdx].name);
    if (!newName) return;
    const updated = [...masterSets];
    updated[setIdx].charts[chartIdx].name = newName;
    setMasterSets(updated);
  };

  const deleteChart = (setIdx, chartIdx) => {
    if (!window.confirm("Delete this chart?")) return;
    const updated = [...masterSets];
    updated[setIdx].charts.splice(chartIdx, 1);
    setMasterSets(updated);
    setActiveSetIndex(0);
    setActiveChartIndex(0);
  };

  // JSON Import/Export
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(masterSets, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progress-data.json";
    a.click();
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setMasterSets(imported);
      } catch {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
  };

  // Filter sets
  const filteredSets = masterSets.filter((set) =>
    set.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart Data
  const chartData = {
    datasets: [
      {
        label: activeChart?.name || "Chart",
        data: activeChart?.data || [],
        borderColor: "blue",
        backgroundColor: "rgba(0,0,255,0.3)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
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

  // Theming
  const themeStyles =
    theme === "dark"
      ? { background: "#222", color: "white" }
      : { background: "#eee", color: "#222" };
  const sidebarStyles =
    theme === "dark" ? { background: "#111" } : { background: "#ddd" };
  const mainStyles =
    theme === "dark" ? { background: "#222" } : { background: "#fff" };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        ...themeStyles,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 300 : 50,
          ...sidebarStyles,
          transition: "width 0.3s",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Reusable small button style */}
        {(() => {
          const style = {
            fontSize: "12px",
            padding: "2px 6px",
            marginLeft: "2px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          };
          return null; // placeholder so React doesn’t render it
        })()}

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            marginBottom: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 24,
            color: theme === "dark" ? "white" : "#222",
          }}
        >
          ☰
        </button>

        {/* Theme Toggle */}
        {sidebarOpen && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              marginBottom: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: theme === "dark" ? "white" : "#222",
            }}
          >
            Toggle {theme === "dark" ? "Light" : "Dark"}
          </button>
        )}

        {/* Search */}
        {sidebarOpen && (
          <input
            type="text"
            placeholder="Search sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "90%",
              margin: "0 auto 10px",
              padding: "4px 6px",
              fontSize: "13px",
            }}
          />
        )}

        {/* Sets */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {filteredSets.map((set, setIdx) => (
            <div key={setIdx} style={{ marginBottom: 10 }}>
              {/* Set Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => toggleSetCollapse(setIdx)}
                    style={{
                      fontSize: "12px",
                      padding: "2px 6px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {set.collapsed ? "▶" : "▼"}
                  </button>
                  <span
                    onClick={() => {
                      setActiveSetIndex(setIdx);
                      setActiveChartIndex(0);
                    }}
                    style={{
                      cursor: "pointer",
                      fontWeight: activeSetIndex === setIdx ? "bold" : "normal",
                      marginLeft: 4,
                    }}
                  >
                    {set.name}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => renameMasterSet(setIdx)}
                    style={{
                      fontSize: "12px",
                      padding: "2px 6px",
                      marginLeft: "2px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteMasterSet(setIdx)}
                    style={{
                      fontSize: "12px",
                      padding: "2px 6px",
                      marginLeft: "2px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Charts in Set */}
              {!set.collapsed && (
                <div style={{ paddingLeft: 15, marginTop: 5 }}>
                  {set.charts.map((chart, chartIdx) => (
                    <div
                      key={chartIdx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 3,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <button
                          onClick={() => toggleChartCollapse(setIdx, chartIdx)}
                          style={{
                            fontSize: "12px",
                            padding: "2px 6px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {chart.collapsed ? "▶" : "▼"}
                        </button>
                        <span
                          onClick={() => {
                            setActiveSetIndex(setIdx);
                            setActiveChartIndex(chartIdx);
                          }}
                          style={{
                            cursor: "pointer",
                            marginLeft: 4,
                            textDecoration:
                              activeSetIndex === setIdx &&
                              activeChartIndex === chartIdx
                                ? "underline"
                                : "none",
                          }}
                        >
                          {chart.name}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => renameChart(setIdx, chartIdx)}
                          style={{
                            fontSize: "12px",
                            padding: "2px 6px",
                            marginLeft: "2px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteChart(setIdx, chartIdx)}
                          style={{
                            fontSize: "12px",
                            padding: "2px 6px",
                            marginLeft: "2px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addChartToSet(setIdx)}
                    style={{
                      marginTop: 3,
                      fontSize: "12px",
                      padding: "3px 6px",
                    }}
                  >
                    + Add Chart
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Master Set */}
        {sidebarOpen && (
          <div
            style={{
              padding: 10,
              borderTop: `1px solid ${theme === "dark" ? "#333" : "#aaa"}`,
            }}
          >
            <button
              onClick={addMasterSet}
              style={{
                fontSize: "12px",
                padding: "3px 6px",
              }}
            >
              + Add Master Set
            </button>
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
          ...mainStyles,
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

        {activeChart && (
          <>
            {/* Start/Goal inputs */}
            <div style={{ marginBottom: 10 }}>
              <label>
                Start Value:{" "}
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
                Start Date:{" "}
                <input
                  type="date"
                  defaultValue={activeChart.startDate}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const updated = [...masterSets];
                    updated[activeSetIndex].charts[activeChartIndex].startDate =
                      val;
                    setMasterSets(updated);
                  }}
                  style={{ margin: "0 5px" }}
                />
              </label>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>
                Goal Value:{" "}
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
                Goal Date:{" "}
                <input
                  type="date"
                  defaultValue={activeChart.goalDate}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const updated = [...masterSets];
                    updated[activeSetIndex].charts[activeChartIndex].goalDate =
                      val;
                    setMasterSets(updated);
                  }}
                  style={{ margin: "0 5px" }}
                />
              </label>
            </div>

            {/* Add data point */}
            <div style={{ marginBottom: 10 }}>
              <label>
                Value:{" "}
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={{ margin: "0 5px" }}
                />
              </label>
              <label>
                Date:{" "}
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
                background: theme === "dark" ? "#111" : "#ddd",
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
          </>
        )}
      </div>
    </div>
  );
}

export default App;
