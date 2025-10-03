import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import "./Home.css";

const SERVER = "http://localhost:5000";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState([]);
  const [planInfo, setPlanInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("fetscr_recent_queries");
    if (stored) {
      try { setRecentQueries(JSON.parse(stored)); } catch { setRecentQueries([]); }
    }
    loadPlan();
  }, []);

  async function loadPlan() {
    try {
      const token = localStorage.getItem("fetscr_token");
      if (!token) return;
      const res = await fetch(`${SERVER}/getPlan`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setPlanInfo(data.plan);
      else setPlanInfo(null);
    } catch (err) {
      console.error("loadPlan error:", err);
      setPlanInfo(null);
    }
  }

  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();
    const finalQuery = customQuery || query.trim();
    if (!finalQuery) return alert("Please enter a query");

    try {
      setLoading(true);
      const token = localStorage.getItem("fetscr_token");
      if (!token) { alert("Please login to scrape data."); navigate("/login"); return; }

      const res = await fetch(`${SERVER}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: finalQuery, pages: 3 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Scrape failed");

      sessionStorage.setItem(
        "fetscr_results",
        JSON.stringify({ results: data.results, query: finalQuery })
      );

      const newRecent = [
        { query: finalQuery, count: data.results.length, time: new Date().toISOString() },
        ...recentQueries.filter((r) => r.query !== finalQuery)
      ].slice(0, 5);

      setRecentQueries(newRecent);
      localStorage.setItem("fetscr_recent_queries", JSON.stringify(newRecent));

      if (data.queries_remaining !== undefined) {
        setPlanInfo({ ...(planInfo || {}), queries_remaining: data.queries_remaining, queries_used: data.queries_used, results_per_query: data.results_per_query });
      }

      navigate("/results", { state: { results: data.results, query: finalQuery } });
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message || "Unknown error"));
    } finally { setLoading(false); }
  };

  return (
    <div className="home-container" id="home">

      {/* New Intro Section */}
      <div className="home-intro">
        <div className="intro-block">
          <h2>What is FETSCR?</h2>
          <p>FETSCR is an AI-powered web scraping platform that helps you gather insights from multiple sources quickly and efficiently. Automate your data collection and get actionable results in minutes.</p>
        </div>
        <div className="intro-block">
          <h2>Why FETSCR?</h2>
          <p>With FETSCR, you save time, reduce manual effort, and ensure accurate and structured data collection. Our platform is easy to use, reliable, and tailored to meet your business or research needs.</p>
        </div>
      </div>

      <h1 className="main-heading">FETSCR</h1>
      <p className="subtitle">Scraping Data Made Simple</p>

      {/* Plan Info */}
      {planInfo ? (
        <div className="plan-info" style={{ marginBottom: 12 }}>
          <strong>Plan:</strong> {planInfo.plan_type || "free"} &nbsp;|&nbsp;
          <strong>Remaining queries:</strong> {planInfo.queries_remaining ?? Math.max(0, (planInfo.allowed_queries || 0) - (planInfo.queries_used || 0))} &nbsp;|&nbsp;
          <strong>Results/query:</strong> {planInfo.results_per_query || planInfo.results}
          &nbsp;&nbsp;
          <button className="plan-btn" onClick={() => navigate("/pricing")}>Change Plan</button>
        </div>
      ) : (
        <div style={{ marginBottom: 0 }}>
          <button className="plan-btn" style={{ marginTop: "-18px" }} onClick={() => navigate("/pricing")}>Select a Plan</button>
        </div>
      )}

      {/* Search Box */}
      <form className="search-box" onSubmit={handleSearch}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="Enter your query..." />
        <button type="submit" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
      </form>

      {/* Recently Scraped */}
      {recentQueries.length > 0 && (
        <div className="recent-queries">
          <h3>Recently Scraped</h3>
          <ul>
            {recentQueries.map((r, i) => (
              <li key={i}>
                <button className="recent-query-btn" onClick={() => handleSearch(null, r.query)}>{r.query}</button>
                <span className="recent-meta">({r.count} results, {new Date(r.time).toLocaleString()})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
