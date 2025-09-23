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
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [dragging, setDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const chartRef = useRef(null);
  const activeChart =
    masterSets[activeSetIndex]?.charts[activeChartIndex] || null;

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setNewDate(today);
  }, []);

  useEffect(() => {
    localStorage.setItem("progressData", JSON.stringify(masterSets));
  }, [masterSets]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  const removePoint = (index) => {
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

const deleteMasterSet = (setIdx) => {
  if (!window.confirm("Delete this set?")) return;

  // Find the actual index in masterSets
  const actualIndex = masterSets.findIndex(set => set === filteredSets[setIdx]);
  if (actualIndex === -1) return;

  const updated = [...masterSets];
  updated.splice(actualIndex, 1);
  setMasterSets(updated);

  // Reset active indexes if needed
  setActiveSetIndex(0);
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

  const filteredSets = masterSets.filter((set) =>
    set.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = {
    datasets: [
      {
        label: activeChart?.name || "Chart",
        data: activeChart?.data || [],
        borderColor: "cyan",
        backgroundColor: "rgba(0,255,255,0.3)",
        tension: 0.3,
        fill: false,
        pointRadius: 5,
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
      x: { type: "time", time: { unit: "day", tooltipFormat: "yyyy-MM-dd" }, title: { display: true, text: "Date" } },
      y: { min: 0, max: 100, title: { display: true, text: "Value" } },
    },
    onClick: null, // disable normal click
    onContextMenu: (event, elements) => {
      event.preventDefault();
      if (elements.length && activeChart) {
        const idx = elements[0].index;
        if (window.confirm(`Delete point ${activeChart.data[idx].x} - ${activeChart.data[idx].y}?`)) {
          removePoint(idx);
        }
      }
    },
  };

  const themeStyles = theme === "dark" ? { background: "#222", color: "white" } : { background: "#eee", color: "#222" };
  const sidebarStyles = theme === "dark" ? { background: "#111" } : { background: "#ddd" };
  const mainStyles = theme === "dark" ? { background: "#222" } : { background: "#fff" };
  const btnSmall = { fontSize: "16px", padding: "2px 4px", marginLeft: "2px", background: "transparent", border: "none", cursor: "pointer" };
  const sidebarIconBtn = { fontSize: "16px", padding: "0", margin: "2px", background: "transparent", border: "none", cursor: "pointer", color: theme === "dark" ? "white" : "#222", lineHeight: 1 };

  const onMouseDown = () => setDragging(true);
  const onMouseMove = (e) => { if(dragging) setSidebarWidth(Math.max(150, e.clientX)); };
  const onMouseUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", ...themeStyles }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? sidebarWidth : 50,
          ...sidebarStyles,
          transition: dragging ? "none" : "width 0.3s",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginBottom: 10, background: "transparent", border: "none", cursor: "pointer", fontSize: 24, color: theme === "dark" ? "white" : "#222" }}>☰</button>
        {sidebarOpen && (
          <>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ marginBottom: 10, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: theme === "dark" ? "white" : "#222" }}>Toggle {theme === "dark" ? "Light" : "Dark"}</button>
            <input type="text" placeholder="Search sets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "90%", margin: "0 auto 10px", padding: "4px 6px", fontSize: "13px" }} />
          </>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {filteredSets.map((set, setIdx) => (
            <div key={setIdx} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <button onClick={() => toggleSetCollapse(setIdx)} style={sidebarIconBtn}>{set.collapsed ? "▶" : "▼"}</button>
                  <span onClick={() => { setActiveSetIndex(setIdx); setActiveChartIndex(0); }} style={{ marginLeft: 4, cursor: "pointer", fontWeight: activeSetIndex === setIdx ? "bold" : "normal" }}>{set.name}</span>
                </div>
                <div>
                  <button onClick={() => renameMasterSet(setIdx)} style={sidebarIconBtn}>✎</button>
                  <button onClick={() => deleteMasterSet(setIdx)} style={sidebarIconBtn}>🗑️</button>
                </div>
              </div>
              {!set.collapsed && <div style={{ paddingLeft: 15, marginTop: 5 }}>
                {set.charts.map((chart, chartIdx) => (
                  <div key={chartIdx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div>
                      <button onClick={() => toggleChartCollapse(setIdx, chartIdx)} style={sidebarIconBtn}>{chart.collapsed ? "▶" : "▼"}</button>
                      <span onClick={() => { setActiveSetIndex(setIdx); setActiveChartIndex(chartIdx); }} style={{ marginLeft: 4, cursor: "pointer", textDecoration: activeSetIndex === setIdx && activeChartIndex === chartIdx ? "underline" : "none" }}>{chart.name}</span>
                    </div>
                    <div>
                      <button onClick={() => renameChart(setIdx, chartIdx)} style={sidebarIconBtn}>✎</button>
                      <button onClick={() => deleteChart(setIdx, chartIdx)} style={sidebarIconBtn}>🗑️</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addChartToSet(setIdx)} style={{ marginTop: 3, fontSize: "12px", padding: "3px 6px" }}>+ Add Chart</button>
              </div>}
            </div>
          ))}
        </div>
        {sidebarOpen && <div style={{ padding: 10, borderTop: `1px solid ${theme === "dark" ? "#333" : "#aaa"}` }}><button onClick={addMasterSet} style={{ fontSize: "12px", padding: "3px 6px" }}>+ Add Master Set</button></div>}
        {sidebarOpen && <div style={{ width: 5, cursor: "col-resize", position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 10 }} onMouseDown={() => setDragging(true)} />}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", minHeight: 0, ...mainStyles }}>
        <h1 style={{ display: "flex", alignItems: "center" }}>
          <img src="https://img.icons8.com/color/48/combo-chart--v1.png" alt="logo" style={{ marginRight: 10 }} />Progress Monitor
        </h1>
        {activeChart && <>
          <div style={{ marginBottom: 10 }}>
            <label>Start Value: <input type="number" value={activeChart.startValue} onChange={(e) => { const updated = [...masterSets]; updated[activeSetIndex].charts[activeChartIndex].startValue = Number(e.target.value); setMasterSets(updated); }} style={{ margin: "0 5px", width: 60 }}/></label>
            <label>Start Date: <input type="date" defaultValue={activeChart.startDate} onBlur={(e) => { const val = e.target.value; if(!val) return; const updated = [...masterSets]; updated[activeSetIndex].charts[activeChartIndex].startDate = val; setMasterSets(updated); }} style={{ margin: "0 5px" }}/></label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Goal Value: <input type="number" value={activeChart.goalValue} onChange={(e) => { const updated = [...masterSets]; updated[activeSetIndex].charts[activeChartIndex].goalValue = Number(e.target.value); setMasterSets(updated); }} style={{ margin: "0 5px", width: 60 }}/></label>
            <label>Goal Date: <input type="date" defaultValue={activeChart.goalDate} onBlur={(e) => { const val = e.target.value; if(!val) return; const updated = [...masterSets]; updated[activeSetIndex].charts[activeChartIndex].goalDate = val; setMasterSets(updated); }} style={{ margin: "0 5px" }}/></label>
          </div>

          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: "5px" }}>
            <label>Value: <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={{ width: 60, marginLeft: 4 }} /></label>
            <label>Date: <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ marginLeft: 4 }} /></label>
            <label>Additional Notes: <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{ marginLeft: 4, flex: 1 }} placeholder="Optional notes..." /></label>
            <button onClick={addPoint} style={btnSmall}>+ Add</button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <button onClick={exportJSON} style={{ ...btnSmall, marginRight: 5 }}>Export</button>
            <input type="file" accept=".json" onChange={importJSON} />
          </div>

          <div style={{ flex: 1, position: "relative", background: theme === "dark" ? "#111" : "#ddd", padding: 20, borderRadius: 8, minHeight: 0 }}>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </div>

          <div style={{ marginTop: 10 }}>
            <textarea value={activeChart.notes} onChange={(e) => { const updated = [...masterSets]; updated[activeSetIndex].charts[activeChartIndex].notes = e.target.value; setMasterSets(updated); }} placeholder="Add notes..." style={{ width: "100%", minHeight: 60, resize: "vertical", padding: 8 }} />
          </div>

          {/* Log */}
          <div style={{ marginTop: 20, maxHeight: 150, overflowY: "auto", background: theme === "dark" ? "#111" : "#ddd", padding: 10, borderRadius: 6 }}>
            <strong>Log:</strong>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {activeChart?.data.map((point, idx) => (
                <li key={idx}>
                  {point.x} - {point.y}%{point.notes ? ` (${point.notes})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </>}
      </div>
    </div>
  );
}

export default App;

