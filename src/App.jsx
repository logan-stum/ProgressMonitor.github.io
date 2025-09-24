import React, { useState, useRef, useEffect } from "react";
import "chartjs-adapter-date-fns";
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
  // ---- State ----
  const [masterSets, setMasterSets] = useState(() => {
    const saved = localStorage.getItem("progressData");
    return saved
      ? JSON.parse(saved)
      : [
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
  const [newNotes, setNewNotes] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300); // adjustable
  const [dragging, setDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState([]);

  const chartRef = useRef(null);

  const activeChart =
    masterSets[activeSetIndex]?.charts[activeChartIndex] || null;

  // ---- Effects: defaults / localStorage ----
  useEffect(() => {
    // default newDate to today
    const today = new Date().toISOString().split("T")[0];
    setNewDate(today);
  }, []);

  useEffect(() => {
    localStorage.setItem("progressData", JSON.stringify(masterSets));
  }, [masterSets]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ---- Utilities ----
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // ---- CRUD for sets / charts / points ----
  const addPoint = () => {
    if (!newValue || !newDate || !activeChart) return;
    const updated = [...masterSets];
    updated[activeSetIndex].charts[activeChartIndex].data.push({
      x: newDate,
      y: Number(newValue),
      notes: newNotes,
    });
    setMasterSets(updated);
    setNewValue("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewNotes("");
  };

  const saveHistory = () => {
  setHistory((prev) => {
    const newHist = [...prev, JSON.stringify(masterSets)];
    if (newHist.length > 20) newHist.shift(); // limit history to 20
    return newHist;
  });
  };

  const undo = () => {
  if (history.length === 0) return;
  const prev = history[history.length - 1];
  setHistory(history.slice(0, -1));
  setMasterSets(JSON.parse(prev));
  };


  const removePoint = (index) => {
    saveHistory();
    const updated = [...masterSets];
    updated[activeSetIndex].charts[activeChartIndex].data.splice(index, 1);
    setMasterSets(updated);
  };


  const addMasterSet = () => {
    const updated = [
      ...masterSets,
      { name: "New Set", collapsed: false, charts: [] },
    ];
    setMasterSets(updated);
    setActiveSetIndex(updated.length - 1);
    setActiveChartIndex(0);
  };

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

  const renameMasterSet = (setIdx) => {
    const newName = prompt("Enter new set name:", masterSets[setIdx].name);
    if (!newName) return;
    const updated = [...masterSets];
    updated[setIdx].name = newName;
    setMasterSets(updated);
  };

  // Important: when listing filteredSets we compute the original master index and pass that
  const deleteMasterSet = (masterIdx) => {
    if (!window.confirm("Delete this set?")) return;
    const updated = [...masterSets];
    // allow deleting even if it's the only set
    updated.splice(masterIdx, 1);
    setMasterSets(updated);
    // clamp active indices
    setActiveSetIndex((p) => clamp(0, 0, Math.max(0, updated.length - 1)));
    setActiveChartIndex(0);
  };

  const renameChart = (setIdx, chartIdx) => {
    const newName = prompt(
      "Enter new chart name:",
      masterSets[setIdx].charts[chartIdx].name
    );
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

  // ---- Import/Export ----
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
        // Basic validation (array of sets with charts)
        if (
          Array.isArray(imported) &&
          imported.every((s) => s.name && Array.isArray(s.charts))
        ) {
          setMasterSets(imported);
          setActiveSetIndex(0);
          setActiveChartIndex(0);
        } else {
          alert("Invalid JSON structure");
        }
      } catch {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
  };

  // ---- Filtered sets (search) ----
  const filteredSets = masterSets.filter((set) =>
    set.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---- Chart data & options ----
  const chartData = {
    datasets: [
      {
        label: activeChart?.name || "Chart",
        data: activeChart?.data || [],
        borderColor: "cyan",
        backgroundColor: "rgba(0,255,255,0.2)",
        tension: 0.25,
        fill: false,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHitRadius: 10, // larger hit area for clicks
      },
      activeChart?.startDate &&
        activeChart?.goalDate && {
          label: "Start → Goal",
          data: [
            { x: activeChart.startDate, y: activeChart.startValue },
            { x: activeChart.goalDate, y: activeChart.goalValue },
          ],
          borderColor: "green",
          borderDash: [6, 6],
          fill: false,
          pointRadius: 0,
        },
    ].filter(Boolean),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "nearest", intersect: false },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day", tooltipFormat: "yyyy-MM-dd" },
        title: { display: true, text: "Date" },
      },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: "Value" },
      },
    },

    // IMPORTANT: Ctrl/Cmd + left click deletes a point
    onClick: (evt, elements) => {
      // elements is an array of active elements at click location
      // evt.native is a PointerEvent in react-chartjs-2 v4
      const isMeta = evt?.native?.metaKey; // cmd on mac
      const isCtrl = evt?.native?.ctrlKey;
      const shouldDelete = isCtrl || isMeta;
      if (!shouldDelete) return;

      if (elements && elements.length && activeChart) {
        const pointIndex = elements[0].index;
        // confirm then delete
        const point = activeChart.data[pointIndex];
        if (!point) return;
        if (
          window.confirm(
            `Delete point ${point.x} — ${point.y}%${point.notes ? ` (${point.notes})` : ""}?`
          )
        ) {
          removePoint(activeSetIndex, activeChartIndex, pointIndex);
        }
      }
    },
  };

  // ---- Sidebar drag (resizable) ----
  const onMouseDown = (e) => {
    setDragging(true);
    // stop propagation so clicks don't toggle open/close
    e.stopPropagation();
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    // use clientX as new width; enforce min and max
    const newW = clamp(e.clientX, 150, 800);
    setSidebarWidth(newW);
  };

  const onMouseUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  // Toggle sidebar but ensure when opening we have sensible width
  const toggleSidebar = () => {
    if (sidebarOpen) {
      // closing
      setSidebarOpen(false);
    } else {
      // opening - ensure width is at least minimum
      setSidebarWidth((w) => (w < 150 ? 300 : w));
      setSidebarOpen(true);
    }
  };

  // ---- Styles/helpers ----
  const themeStyles =
    theme === "dark"
      ? { background: "#222", color: "white" }
      : { background: "#eee", color: "#222" };
  const sidebarStyles = theme === "dark" ? { background: "#111" } : { background: "#ddd" };
  const mainStyles = theme === "dark" ? { background: "#222" } : { background: "#fff" };

  const btnSmall = {
    fontSize: "14px",
    padding: "2px 6px",
    marginLeft: 6,
    background: "transparent",
    border: "none",
    cursor: "pointer",
  };

  const sidebarIconBtn = {
    fontSize: "16px",
    padding: 0,
    margin: "2px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: theme === "dark" ? "white" : "#222",
    lineHeight: 1,
  };

  // ---- Render ----
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", ...themeStyles }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? sidebarWidth : 50,
          ...sidebarStyles,
          transition: dragging ? "none" : "width 0.2s",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button
          onClick={toggleSidebar}
          style={{
            marginBottom: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 22,
            color: theme === "dark" ? "white" : "#222",
          }}
          title="Toggle sidebar"
        >
          ☰
        </button>

        {sidebarOpen && (
          <>
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              style={{
                marginBottom: 8,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: theme === "dark" ? "white" : "#222",
              }}
            >
              Toggle {theme === "dark" ? "Light" : "Dark"}
            </button>

            <input
              type="text"
              placeholder="Search sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "90%", margin: "0 auto 10px", padding: "4px 6px", fontSize: "13px" }}
            />
          </>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {filteredSets.map((set, visibleIdx) => {
            // compute the original index in masterSets so actions operate on correct item
            const masterIdx = masterSets.indexOf(set);
            return (
              <div key={masterIdx} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button onClick={() => toggleSetCollapse(masterIdx)} style={sidebarIconBtn} title="Collapse/expand set">
                      {set.collapsed ? "▶" : "▼"}
                    </button>
                    <span
                      onClick={() => {
                        setActiveSetIndex(masterIdx);
                        setActiveChartIndex(0);
                      }}
                      style={{ marginLeft: 6, cursor: "pointer", fontWeight: activeSetIndex === masterIdx ? "bold" : "normal" }}
                    >
                      {set.name}
                    </span>
                  </div>

                  <div>
                    <button onClick={() => renameMasterSet(masterIdx)} style={sidebarIconBtn} title="Rename set">
                      ✎
                    </button>
                    <button onClick={() => deleteMasterSet(masterIdx)} style={sidebarIconBtn} title="Delete set">
                      🗑️
                    </button>
                  </div>
                </div>

                {!set.collapsed && (
                  <div style={{ paddingLeft: 15, marginTop: 6 }}>
                    {set.charts.map((chart, chartIdx) => (
                      <div key={chartIdx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <button onClick={() => toggleChartCollapse(masterIdx, chartIdx)} style={sidebarIconBtn} title="Collapse/expand chart">
                            {chart.collapsed ? "▶" : "▼"}
                          </button>
                          <span
                            onClick={() => {
                              setActiveSetIndex(masterIdx);
                              setActiveChartIndex(chartIdx);
                            }}
                            style={{ marginLeft: 6, cursor: "pointer", textDecoration: activeSetIndex === masterIdx && activeChartIndex === chartIdx ? "underline" : "none" }}
                          >
                            {chart.name}
                          </span>
                        </div>

                        <div>
                          <button onClick={() => renameChart(masterIdx, chartIdx)} style={sidebarIconBtn} title="Rename chart">
                            ✎
                          </button>
                          <button onClick={() => deleteChart(masterIdx, chartIdx)} style={sidebarIconBtn} title="Delete chart">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => addChartToSet(masterIdx)}
                      style={{
                        marginTop: 6,
                        fontSize: "12px",
                        padding: "3px 6px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      + Add Chart
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sidebarOpen && (
          <div style={{ padding: 10, borderTop: `1px solid ${theme === "dark" ? "#333" : "#aaa"}` }}>
            <button
              onClick={addMasterSet}
              style={{ fontSize: "12px", padding: "3px 6px", background: "transparent", border: "none", cursor: "pointer" }}
            >
              + Add Master Set
            </button>
          </div>
        )}

        {/* Draggable handle */}
        {sidebarOpen && (
          <div
            style={{ width: 6, cursor: "col-resize", position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 20 }}
            onMouseDown={onMouseDown}
          />
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", minHeight: 0, ...mainStyles }}>
        <h1 style={{ display: "flex", alignItems: "center" }}>
          <img src="https://img.icons8.com/color/48/combo-chart--v1.png" alt="logo" style={{ marginRight: 10 }} />
          Progress Monitor
        </h1>

        {activeChart && (
          <>
            {/* Start / Goal */}
            <div style={{ marginBottom: 10 }}>
              <label>
                Start Value:
                <input
                  type="number"
                  value={activeChart.startValue}
                  onChange={(e) => {
                    const updated = [...masterSets];
                    updated[activeSetIndex].charts[activeChartIndex].startValue = Number(e.target.value);
                    setMasterSets(updated);
                  }}
                  style={{ margin: "0 8px", width: 80 }}
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
                  style={{ margin: "0 8px" }}
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
                    updated[activeSetIndex].charts[activeChartIndex].goalValue = Number(e.target.value);
                    setMasterSets(updated);
                  }}
                  style={{ margin: "0 8px", width: 80 }}
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
                  style={{ margin: "0 8px" }}
                />
              </label>
            </div>

            {/* Add Data row */}
            <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <label>
                Value:
                <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={{ width: 80, marginLeft: 6 }} />
              </label>

              <label>
                Date:
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ marginLeft: 6 }} />
              </label>

              <label>Additional Notes: <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ marginLeft: 4, flex: 1 }} placeholder="Optional notes..." /></label>

              <button onClick={addPoint} style={btnSmall} title="Add data (resets date to today)">
                + Add
              </button>
            </div>

            {/* Export / Import */}
            <div style={{ marginBottom: 10 }}>
              <button onClick={exportJSON} style={{ ...btnSmall, marginRight: 8 }}>
                Export
              </button>
              <input type="file" accept=".json" onChange={importJSON} />
            </div>

            {/* Chart */}
            <div style={{ flex: 1, position: "relative", background: theme === "dark" ? "#111" : "#ddd", padding: 18, borderRadius: 8, minHeight: 0 }}>
              <div style={{ fontSize: 12, marginBottom: 6, color: theme === "dark" ? "#ddd" : "#333" }}>
                Tip: hold Ctrl and left-click a point to delete it.
              </div>

              <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>

            {/* Chart notes */}
            <div style={{ marginTop: 10 }}>
              <textarea
                value={activeChart.notes}
                onChange={(e) => {
                  const updated = [...masterSets];
                  updated[activeSetIndex].charts[activeChartIndex].notes = e.target.value;
                  setMasterSets(updated);
                }}
                placeholder="Add notes..."
                style={{ width: "100%", minHeight: 60, resize: "vertical", padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <button onClick={undo} style={btnSmall} disabled={history.length === 0}>
                Undo
              </button>
            </div>

            {/* Log */}
            <div style={{ marginTop: 16, maxHeight: 150, overflowY: "auto", background: theme === "dark" ? "#111" : "#ddd", padding: 10, borderRadius: 6 }}>
              <strong>Log:</strong>
              <ul style={{ margin: 6, paddingLeft: 18 }}>
                {activeChart?.data.map((point, idx) => (
                  <li key={idx}>
                    {point.x} - {point.y}%{point.notes ? ` (${point.notes})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
