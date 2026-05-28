import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BarChart3, TrendingUp, Users, Heart, MessageSquare, Eye } from 'lucide-react';

export default function Analytics() {
  const { apiCall } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await apiCall('/analytics');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics details:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Calculating dashboard insights...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Could not compute analytics. Please check backend connection.</p>
      </div>
    );
  }

  const { summary, growthTrend, heatmap, topPosts } = data;

  // Custom SVG Area Chart Dimensions & Computations
  const width = 600;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;

  // Find Min & Max followers to scale y-axis dynamically
  const followerVals = growthTrend.map((g) => g.followers);
  const maxFollowers = Math.max(...followerVals, 100);
  const minFollowers = Math.max(0, Math.min(...followerVals) - 10);

  // Map values to coordinates
  const points = growthTrend.map((item, index) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / (growthTrend.length - 1);
    const y =
      height -
      paddingY -
      ((item.followers - minFollowers) * (height - 2 * paddingY)) / (maxFollowers - minFollowers || 1);
    return { x, y, label: item.name, val: item.followers };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Custom SVG Bar Chart Computations for Engagement Heatmap
  const barWidth = 500;
  const barHeight = 200;
  const bPaddingX = 35;
  const bPaddingY = 20;

  const engagementVals = heatmap.map((h) => h.engagement);
  const maxEngagement = Math.max(...engagementVals, 10);

  const bars = heatmap.map((item, index) => {
    const x = bPaddingX + (index * (barWidth - 2 * bPaddingX)) / (heatmap.length - 1);
    const y =
      barHeight -
      bPaddingY -
      (item.engagement * (barHeight - 2 * bPaddingY)) / maxEngagement;
    const w = 24;
    return {
      x: x - w / 2,
      y,
      w,
      h: barHeight - bPaddingY - y,
      label: item.hour,
      val: item.engagement,
    };
  });

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BarChart3 size={28} style={{ color: 'var(--primary)' }} />
        <span>User Engagement Insights</span>
      </h2>

      {/* Metrics Row Grid */}
      <div className="analytics-grid">
        
        {/* Followers Card */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Total Followers</span>
            <Users size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="metric-value">{summary.followers}</div>
          <div className="metric-sub">Across connected circles</div>
        </div>

        {/* Engagement Rate Card */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Engagement Rate</span>
            <TrendingUp size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <div className="metric-value">{summary.engagementRate}</div>
          <div className="metric-sub">Average per authored post</div>
        </div>

        {/* Profile Views Card */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Profile Impressions</span>
            <Eye size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="metric-value">{summary.profileViews}</div>
          <div className="metric-sub">Organic views last 7 days</div>
        </div>

        {/* Total Likes Card */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Received Likes</span>
            <Heart size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="metric-value">{summary.likes}</div>
          <div className="metric-sub">Cumulative likes collected</div>
        </div>

      </div>

      {/* Visual Graphs Layout */}
      <div className="charts-row">
        
        {/* Follower Growth area visualizer */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Follower Growth (7-Day Trend)</h3>
          
          <div className="chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (height - 2 * paddingY);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    className="chart-grid-line"
                  />
                );
              })}

              {/* Area path */}
              <path d={areaPath} className="chart-area" />

              {/* Line path */}
              <path d={linePath} className="chart-line" />

              {/* Data circles on line */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={5} className="chart-point" />
                  {/* Floating count values above points */}
                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-axis-text" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                    {p.val}
                  </text>
                  {/* Axis horizontal labels */}
                  <text x={p.x} y={height - 4} textAnchor="middle" className="chart-axis-text">
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Engagement heatmap bar visualizer */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Engagement Heatmap (Time of Day)</h3>
          
          <div className="chart-container">
            <svg viewBox={`0 0 ${barWidth} ${barHeight}`} className="chart-svg">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = bPaddingY + ratio * (barHeight - 2 * bPaddingY);
                return (
                  <line
                    key={i}
                    x1={bPaddingX}
                    y1={y}
                    x2={barWidth - bPaddingX}
                    y2={y}
                    className="chart-grid-line"
                  />
                );
              })}

              {/* Vertical bars */}
              {bars.map((bar, i) => (
                <g key={i}>
                  <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.w}
                    height={bar.h}
                    className="chart-bar"
                  />
                  {/* Value tag above bar */}
                  <text x={bar.x + bar.w / 2} y={bar.y - 6} textAnchor="middle" className="chart-axis-text" style={{ fontSize: '8px' }}>
                    {bar.val}
                  </text>
                  {/* Axis hourly labels */}
                  <text x={bar.x + bar.w / 2} y={barHeight - 4} textAnchor="middle" className="chart-axis-text">
                    {bar.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

      </div>

      {/* Bottom Row - Top Performing posts */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Top Performing Content</h3>
        
        {topPosts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
            Publish posts and gain likes to view performance stats.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {topPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <p style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.4',
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {post.content}
                  </p>
                  {post.mediaUrl && (
                    <img
                      src={`http://localhost:5000${post.mediaUrl}`}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.75rem' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Heart size={14} style={{ color: 'var(--accent)' }} />
                    {post.likesCount} Likes
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MessageSquare size={14} style={{ color: 'var(--secondary)' }} />
                    {post.commentsCount} Comments
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
