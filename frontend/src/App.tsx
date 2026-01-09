import React, { useState, useMemo } from 'react'
import Plot from "react-plotly.js"

//Define TypeScript types
type Constituent = { name:string; weight: number; latest_close: number};
type SeriesPoint = { date: string; price: number};
type Holding = { name:string; holding_value:number};

//Declare types for Additional Sorting Feature
type SortKey = "name" | "weight" | "latest_close";
type SortDir = "asc" | "desc";

function App() {
  //Create reactive variables 
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [etfSeries, setEtfSeries] = useState<SeriesPoint[]>([]);
  const [topHoldings, setTopHoldings] = useState<Holding[]>([]);
  const [error, setError] = useState<string | null>(null);

  //Variables for Additional Features
  const [loading,setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [sortDir, setSortDir] = useState<SortDir>("desc");


  //File Upload
  const fileUpload = async (file: File) => {
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try{
      const res = await fetch("http://localhost:8000/process", {
        method: "POST",
        body: formData,
      });

      //Backend Payload Error Check
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        setError(msg.detail ?? "Upload failed");
        return;
      }

      //Parse JSON Data and update all state variables
      const data = await res.json();
      setConstituents(data.constituents);
      setEtfSeries(data.etf_series);
      setTopHoldings(data.top_holdings);

    } catch {
      setError("Backend Unreachable")
    } finally {
      setLoading(false);
    }
  };

  //Additional feature to add a search functionality
  const filtered = useMemo(() => {
    //Remove extra spaces and converts query to lowercase
    const q = query.trim().toLowerCase();
    //Return full list if query is empty
    if (!q) return constituents;
    return constituents.filter((c) => c.name.toLowerCase().includes(q));
  }, [constituents, query])

  //Additional feature to sort by table headers
  const filterSorted = useMemo(() => {
    const base = filtered;
    const sorted = [...base].sort((a,b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv);
      }
      return (av as number) - (bv as number);
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [filtered, sortKey, sortDir])

  //Handling table header clicks
  const toggleSort = (key: SortKey) => {
  if (sortKey !== key) {
    setSortKey(key);
    setSortDir(key === "name" ? "asc" : "desc");
  } else {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }
  };

  return (
   <div className="min-h-screen bg-slate-50 text-slate-900">
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">BMO ETF Viewer</h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload an ETF Weights CSV to view the breakdown. Built by Magilan Varatharuban
          </p>
        </div>
        <label
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm border
            ${
              loading
                ? "cursor-not-allowed bg-slate-200 text-slate-500 border-slate-200"
                : "cursor-pointer bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
            }`}
        >
        <input 
          type ="file" 
          accept='.csv' 
          disabled={loading} 
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) fileUpload(file);
            e.currentTarget.value = ""
          }}
        />
        <span className={`h-2 w-2 rounded-full ${loading ? "bg-slate-400" : "bg-emerald-500"}`} />
        {loading ? "Uploading" : "Upload CSV"}
        </label>
      </div>
      
      

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">Constituents</h2>
            <span className="text-xs text-slate-500">
              {constituents.length ? `${constituents.length} rows` : "No data"}
            </span>
          </div>

          <div className="mt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Constituent Name"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th
                onClick={() => toggleSort("name")}
                className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-900"
              >
                Constituent Name {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>

              <th
                onClick={() => toggleSort("weight")}
                className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-900"
              >
                Weight {sortKey === "weight" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>

              <th
                onClick={() => toggleSort("latest_close")}
                className="cursor-pointer select-none px-4 py-3 text-left font-medium hover:text-slate-900"
              >
                Latest Closing Price{" "}
                {sortKey === "latest_close" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filterSorted.map((c) => (
              <tr key={c.name} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-700">{c.weight.toFixed(4)}</td>
                <td className="px-4 py-3 text-slate-700">${c.latest_close.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        </div>
      </div>


      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold">ETF Time Series </h2>
          <p className="text-sm text-slate-600">ETF prices (weighted sum of the individual prices) over time</p>
        </div>
        <div className="p-4">
          <Plot
            data={[
              {
                x: etfSeries.map((p) => p.date),
                y: etfSeries.map((p) => p.price),
                type: "scatter",
                mode: "lines",
              },
            ]}
            layout={{
              title: "",
              xaxis: {
                title: { text: "Date", standoff: 10 },
                automargin: true,
              },
              yaxis: {
                title: { text: "Price", standoff: 10 },
                automargin: true,
              },
              autosize: true,
              margin: { l: 70, r: 20, t: 10, b: 70 },
            }}
            config={{ responsive: true, scrollZoom: true }}
            style={{ width: "100%", height: 380 }}
            useResizeHandler
          />
        </div>
      </div>


      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold">Top 5 Holdings</h2>
          <p className="text-sm text-slate-600">Holding value = weight × latest closing price.</p>
        </div>
        <div className="p-4">
          <Plot
            data={[
              {
                x:topHoldings.map((h) => h.name),
                y:topHoldings.map((h) => h.holding_value),
                type: "bar",
              },
            ]}
            layout={{
              title: "",
               xaxis: {
                title: { text: "Constituent Name", standoff: 10 },
                automargin: true,
                tickangle: -20, // optional if names crowd
              },
              yaxis: {
                title: { text: "Holding Value", standoff: 10 },
                automargin: true,
              },
              autosize: true,
              margin: { l: 50, r: 20, t: 10, b: 40 },
            }}
            config={{ responsive: true }}
            style={{ width: "100%", height: 320 }}
            useResizeHandler
          />
        </div>
      </div>
    </div>
   </div>
  );
}

export default App
