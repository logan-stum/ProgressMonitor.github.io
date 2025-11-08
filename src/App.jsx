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
import zoomPlugin from "chartjs-plugin-zoom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

function App() {
  // ---- State ----
  const [masterSets, setMasterSets] = useState(() => {
    const saved = localStorage.getItem("progressData");
    return saved
      ? JSON.parse(saved)
      : [
          {
            name: "Student",
            collapsed: false,
            charts: [
              {
                name: "Goal 1",
                collapsed: false,
                startValue: 0,
                startDate: "",
                goalValue: 100,
                goalDate: "",
                data: [],
                notes: "",
                attachments: [],
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
  const [history, setHistory] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);

  const chartRef = useRef(null);
  const activeChart =
    masterSets[activeSetIndex]?.charts[activeChartIndex] || null;

  // ---- Effects ----
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

  // ---- Helpers ----
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sanitizeAndSortData = (dataArr) =>
    (Array.isArray(dataArr) ? dataArr : [])
      .map((p) => ({ ...p, y: clamp(Number(p.y), 0, 100) }))
      .sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

  const saveHistory = () => {
    setHistory((prev) => {
      const newHist = [...prev, JSON.stringify(masterSets)];
      if (newHist.length > 20) newHist.shift();
      return newHist;
    });
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setMasterSets(JSON.parse(prev));
  };

  // ---- CRUD ----
  const addPoint = () => {
    if (!newValue || !newDate || !activeChart) return;
    saveHistory();
    const updated = [...masterSets];
    updated[activeSetIndex].charts[activeChartIndex].data.push({
      x: newDate,
      y: clamp(Number(newValue), 0, 100),
      notes: newNotes,
    });
    updated[activeSetIndex].charts[activeChartIndex].data = sanitizeAndSortData(
      updated[activeSetIndex].charts[activeChartIndex].data
    );
    setMasterSets(updated);
    setNewValue("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewNotes("");
  };

  const removePoint = (setIdx, chartIdx, index) => {
    saveHistory();
    const updated = [...masterSets];
    updated[setIdx].charts[chartIdx].data.splice(index, 1);
    updated[setIdx].charts[chartIdx].data = sanitizeAndSortData(
      updated[setIdx].charts[chartIdx].data
    );
    setMasterSets(updated);
  };

  const editPoint = (setIdx, chartIdx, index) => {
    const point = masterSets[setIdx].charts[chartIdx].data[index];
    if (!point) return;
    const newVal = prompt("Edit value (0-100):", point.y);
    if (newVal === null) return;
    const newNotes = prompt("Edit notes:", point.notes || "") || "";
    saveHistory();
    const updated = [...masterSets];
    updated[setIdx].charts[chartIdx].data[index] = {
      ...point,
      y: clamp(Number(newVal), 0, 100),
      notes: newNotes,
    };
    updated[setIdx].charts[chartIdx].data = sanitizeAndSortData(
      updated[setIdx].charts[chartIdx].data
    );
    setMasterSets(updated);
  };

  const addAttachment = (file) => {
    if (!file || !activeChart) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result.split(",")[1];
      const updated = [...masterSets];
      if (!Array.isArray(updated[activeSetIndex].charts[activeChartIndex].attachments))
        updated[activeSetIndex].charts[activeChartIndex].attachments = [];
      updated[activeSetIndex].charts[activeChartIndex].attachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        content,
      });
      setMasterSets(updated);
    };
    reader.readAsDataURL(file);
  };

  const downloadAttachment = (file) => {
    try {
      const bytes = Uint8Array.from(atob(file.content), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: file.type || "application/octet-stream" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Failed to download attachment");
    }
  };

  const addMasterSet = () => {
    const updated = [...masterSets, { name: "Student", collapsed: false, charts: [] }];
    setMasterSets(updated);
    setActiveSetIndex(updated.length - 1);
    setActiveChartIndex(0);
  };

  const addChartToSet = (setIdx) => {
    const updated = [...masterSets];
    updated[setIdx].charts.push({
      name: `Goal ${updated[setIdx].charts.length + 1}`,
      collapsed: false,
      startValue: 0,
      startDate: "",
      goalValue: 100,
      goalDate: "",
      data: [],
      notes: "",
      attachments: [],
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
    updated[setIdx].charts[chartIdx].collapsed = !updated[setIdx].charts[chartIdx].collapsed;
    setMasterSets(updated);
  };

  const renameMasterSet = (setIdx) => {
    const newName = prompt("Enter student's name:", masterSets[setIdx].name);
    if (!newName) return;
    const updated = [...masterSets];
    updated[setIdx].name = newName;
    setMasterSets(updated);
  };

  const deleteMasterSet = (masterIdx) => {
    if (!window.confirm("Delete this set?")) return;
    const updated = [...masterSets];
    updated.splice(masterIdx, 1);
    setMasterSets(updated);
    setActiveSetIndex(Math.min(activeSetIndex, Math.max(0, updated.length - 1)));
    setActiveChartIndex(0);
  };

  const renameChart = (setIdx, chartIdx) => {
    const newName = prompt(
      "Enter new goal name:",
      masterSets[setIdx].charts[chartIdx].name
    );
    if (!newName) return;
    const updated = [...masterSets];
    updated[setIdx].charts[chartIdx].name = newName;
    setMasterSets(updated);
  };

  const deleteChart = (setIdx, chartIdx) => {
    if (!window.confirm("Delete this goal?")) return;
    const updated = [...masterSets];
    updated[setIdx].charts.splice(chartIdx, 1);
    setMasterSets(updated);
    setActiveSetIndex(0);
    setActiveChartIndex(0);
  };

  // ---- Import/Export ----
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(masterSets, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "progress-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported) && imported.every(s => s.name && Array.isArray(s.charts))) {
          const sanitized = imported.map((s) => ({
            ...s,
            charts: (s.charts || []).map((c) => ({
              ...c,
              attachments: Array.isArray(c.attachments) ? c.attachments : [],
              data: sanitizeAndSortData(c.data),
            })),
          }));
          setMasterSets(sanitized);
          setActiveSetIndex(0);
          setActiveChartIndex(0);
        } else alert("Invalid JSON structure");
      } catch {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
  };

  const filteredSets = masterSets.filter((set) =>
    set.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---- Chart Data & Options ----
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
        pointHitRadius: 10,
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
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "xy",
        },
        pan: { enabled: true, mode: "xy" },
      },
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
        title: { display: true, text: "Accuracy" },
      },
    },
    onClick: (evt, elements) => {
      const isMeta = evt?.native?.metaKey;
      const isCtrl = evt?.native?.ctrlKey;
      if (!activeChart || !elements?.length) return;
      const pointIndex = elements[0].index;
      const point = activeChart.data[pointIndex];
      if (!point) return;
      if (isCtrl || isMeta) {
        if (window.confirm(`Delete point ${point.x} — ${point.y}%${point.notes ? ` (${point.notes})` : ""}?`)) {
          removePoint(activeSetIndex, activeChartIndex, pointIndex);
        }
      } else {
        editPoint(activeSetIndex, activeChartIndex, pointIndex);
      }
    },
  };

  // ---- Sidebar drag ----
  const onMouseDown = (e) => { setDragging(true); e.stopPropagation(); };
  const onMouseMove = (e) => { if (!dragging) return; setSidebarWidth(clamp(e.clientX, 150, 800)); };
  const onMouseUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const toggleSidebar = () => {
    if (sidebarOpen) setSidebarOpen(false);
    else { setSidebarWidth(w => (w < 150 ? 300 : w)); setSidebarOpen(true); }
  };

  // ---- Styles ----
  const themeStyles = theme === "dark" ? { background: "#222", color: "white" } : { background: "#eee", color: "#222" };
  const sidebarStyles = theme === "dark" ? { background: "#111" } : { background: "#ddd" };
  const mainStyles = theme === "dark" ? { background: "#222" } : { background: "#fff" };
  const btnSmall = { fontSize: "14px", padding: "2px 6px", marginLeft: 6, background: "transparent", border: "none", cursor: "pointer" };
  const sidebarIconBtn = { fontSize: "16px", padding: 0, margin: "2px", background: "transparent", border: "none", cursor: "pointer", color: theme === "dark" ? "white" : "#222", lineHeight: 1 };

  // ---- Render ----
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", ...themeStyles }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? sidebarWidth : 50, ...sidebarStyles, transition: dragging ? "none" : "width 0.2s", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", position: "relative" }}>
        <button onClick={toggleSidebar} style={{ marginBottom: 10, background: "transparent", border: "none", cursor: "pointer", fontSize: 22, color: theme === "dark" ? "white" : "#222" }} title="Toggle sidebar">☰</button>
        {sidebarOpen && <>
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ marginBottom: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: theme === "dark" ? "white" : "#222" }}>Toggle {theme === "dark" ? "Light" : "Dark"}</button>
          <input type="text" placeholder="Search sets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: "90%", margin: "0 auto 10px", padding: "4px 6px", fontSize: "13px" }} />
        </>}
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {filteredSets.map((set, visibleIdx) => {
            const masterIdx = masterSets.indexOf(set);
            return (
              <div key={masterIdx} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button onClick={() => toggleSetCollapse(masterIdx)} style={sidebarIconBtn} title="Collapse/expand set">{set.collapsed ? "▶" : "▼"}</button>
                    <span onClick={() => { setActiveSetIndex(masterIdx); setActiveChartIndex(0); }} style={{ marginLeft: 6, cursor: "pointer", fontWeight: activeSetIndex === masterIdx ? "bold" : "normal" }}>{set.name}</span>
                  </div>
                  <div>
                    <button onClick={() => renameMasterSet(masterIdx)} style={sidebarIconBtn} title="Rename set">✎</button>
                    <button onClick={() => deleteMasterSet(masterIdx)} style={sidebarIconBtn} title="Delete set">🗑️</button>
                  </div>
                </div>
                {!set.collapsed && <div style={{ paddingLeft: 15, marginTop: 6 }}>
                  {set.charts.map((chart, chartIdx) => (
                    <div key={chartIdx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <button onClick={() => toggleChartCollapse(masterIdx, chartIdx)} style={sidebarIconBtn} title="Collapse/expand chart">{chart.collapsed ? "▶" : "▼"}</button>
                        <span onClick={() => { setActiveSetIndex(masterIdx); setActiveChartIndex(chartIdx); }} style={{ marginLeft: 6, cursor: "pointer", textDecoration: activeSetIndex === masterIdx && activeChartIndex === chartIdx ? "underline" : "none" }}>{chart.name}</span>
                      </div>
                      <div>
                        <button onClick={() => renameChart(masterIdx, chartIdx)} style={sidebarIconBtn} title="Rename chart">✎</button>
                        <button onClick={() => deleteChart(masterIdx, chartIdx)} style={sidebarIconBtn} title="Delete chart">🗑️</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addChartToSet(masterIdx)} style={{ ...btnSmall, marginTop: 4 }}>+ Add Goal</button>
                </div>}
              </div>
            );
          })}
          <button onClick={addMasterSet} style={{ ...btnSmall, marginTop: 10 }}>+ Add Student</button>
        </div>
        <div onMouseDown={onMouseDown} style={{ width: 5, cursor: "col-resize", position: "absolute", right: 0, top: 0, bottom: 0, zIndex: 5, background: dragging ? "gray" : "transparent" }} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 15, ...mainStyles, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeChart && <>
          <h2>{activeChart.name} — {masterSets[activeSetIndex].name}</h2>
          <div style={{ display: "flex", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
            <input type="number" placeholder="Value" min={0} max={100} value={newValue} onChange={e => setNewValue(e.target.value)} style={{ width: 60 }} />
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <input type="text" placeholder="Notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} />
            <button onClick={addPoint} style={btnSmall}>Add Point</button>
            <button onClick={undo} style={btnSmall}>Undo</button>
            <button onClick={exportJSON} style={btnSmall}>Export</button>
            <label style={btnSmall}>
              Import <input type="file" accept="application/json" style={{ display: "none" }} onChange={importJSON} />
            </label>
            <label style={btnSmall}>
              Attach <input type="file" style={{ display: "none" }} onChange={e => addAttachment(e.target.files[0])} />
            </label>
            {activeChart.attachments?.length > 0 && <button onClick={() => setShowAttachments(s => !s)} style={btnSmall}>{showAttachments ? "Hide" : "Show"} Attachments</button>}
          </div>
          {showAttachments && activeChart.attachments?.length > 0 && (
            <div style={{ maxHeight: 120, overflowY: "auto", marginBottom: 10, border: "1px solid #888", padding: 5 }}>
              {activeChart.attachments.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span>{f.name} ({Math.round(f.size/1024)} KB)</span>
                  <button onClick={() => downloadAttachment(f)} style={btnSmall}>Download</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        </>}
        {!activeChart && <div>Select a chart from the sidebar</div>}
      </div>
    </div>
  );
}

export default App;
