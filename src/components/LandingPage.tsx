import React, { useState } from 'react';
import { ParticleSphere } from './ParticleSphere';
import {
  Sparkles, ArrowRight, Play, Zap,
  BarChart3, FileSpreadsheet, CheckCircle2,
  Terminal, Layers, Cpu, Lock
} from 'lucide-react';
import type { UserAccount } from '../services/authService';
import { UserAccountMenu } from './UserAccountMenu';

interface LandingPageProps {
  onLaunchStudio: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  user: UserAccount | null;
  onSignOut: () => void;
  onSwitchAccount?: (account: UserAccount) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchStudio,
  onOpenSignIn,
  onOpenSignUp,
  user,
  onSignOut,
  onSwitchAccount,
}) => {
  const [activeDemoQuery, setActiveDemoQuery] = useState('Show top 5 customers by spend');

  const demoResults: Record<string, { sql: string; rows: any[] }> = {
    'Show top 5 customers by spend': {
      sql: 'SELECT c.name, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id ORDER BY total_spent DESC LIMIT 5;',
      rows: [
        { name: 'Marcus Vance', spent: '$4,820.00', orders: 8 },
        { name: 'Elena Rostova', spent: '$3,910.50', orders: 6 },
        { name: 'Devon Hayes', spent: '$2,840.20', orders: 5 },
        { name: 'Sarah Lin', spent: '$2,190.00', orders: 4 },
        { name: 'Kaelen Morse', spent: '$1,950.80', orders: 3 },
      ],
    },
    'Revenue by category': {
      sql: 'SELECT p.category, SUM(oi.quantity * oi.unit_price) as revenue FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.category ORDER BY revenue DESC;',
      rows: [
        { name: 'Electronics', spent: '$18,450.00', orders: 120 },
        { name: 'Footwear', spent: '$9,280.50', orders: 64 },
        { name: 'Apparel', spent: '$6,420.00', orders: 48 },
        { name: 'Accessories', spent: '$4,110.00', orders: 35 },
      ],
    },
    'Low stock alerts': {
      sql: 'SELECT title, category, stock_qty, price FROM products WHERE stock_qty < 30 ORDER BY stock_qty ASC;',
      rows: [
        { name: 'Waterproof Hiking Boots', spent: '22 in stock', orders: 4.8 },
        { name: 'Ultra HD 4K Monitor', spent: '28 in stock', orders: 4.6 },
        { name: 'Minimalist Backpack', spent: '35 in stock', orders: 4.9 },
      ],
    },
  };

  const activeData = demoResults[activeDemoQuery] || demoResults['Show top 5 customers by spend'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07080c',
      color: '#f8fafc',
      overflowX: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ─── NAVBAR ─── */}
      <nav style={{
        height: '68px',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(7, 8, 12, 0.75)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }} onClick={onLaunchStudio}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--accent) 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(139, 92, 246, 0.3)'
            }}>
              <Zap size={17} color="#ffffff" />
            </div>
            <span className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
              BolDB
            </span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#features" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
               onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
               onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Features
            </a>
            <a href="#demo" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
               onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
               onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Interactive Demo
            </a>
            <a href="#architecture" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
               onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
               onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Architecture
            </a>
            <a href="#security" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
               onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
               onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              Privacy
            </a>
          </div>
        </div>

        {/* Auth & Launch CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <UserAccountMenu
              user={user}
              onSignOut={onSignOut}
              onSwitchAccount={onSwitchAccount || (() => {})}
              onAddAccount={onOpenSignUp}
            />
          ) : (
            <>
              <button
                onClick={onOpenSignIn}
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}
              >
                Sign In
              </button>

              <button
                onClick={onOpenSignUp}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', borderRadius: 'var(--radius-full)', padding: '7px 16px' }}
              >
                Sign Up
              </button>
            </>
          )}

          <button
            onClick={onLaunchStudio}
            className="btn btn-primary"
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '8px 20px',
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '6px'
            }}
          >
            <span>Launch Studio</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ─── HERO SECTION (Matching Image 1 Optimus Layout) ─── */}
      <section style={{
        maxWidth: '1380px',
        margin: '0 auto',
        padding: '50px 40px 60px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr',
        gap: '40px',
        alignItems: 'center',
        minHeight: 'calc(85vh - 68px)',
      }}>
        {/* Left Column: Bold Editorial Typography */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Subtitle tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', letterSpacing: '0.04em', fontWeight: 500 }}>
              — The AI database platform for modern teams
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '4.4rem',
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#ffffff',
            margin: 0
          }}>
            The platform <br />
            to build & query.
          </h1>

          {/* Description */}
          <p style={{
            fontSize: '1.15rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            maxWidth: '520px',
            margin: 0,
            fontWeight: 400
          }}>
            Your toolkit to stop writing boilerplate SQL and start innovating.
            Securely query, inspect, visualize, and edit databases with Gemini AI and client-side SQLite WASM.
          </p>

          {/* Hero CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px' }}>
            <button
              onClick={onLaunchStudio}
              className="btn btn-primary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '13px 28px',
                fontSize: '0.92rem',
                fontWeight: 700,
                boxShadow: '0 4px 25px rgba(139, 92, 246, 0.4)',
                gap: '8px'
              }}
            >
              <span>Launch Studio Free</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="#demo"
              className="btn btn-secondary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '13px 24px',
                fontSize: '0.92rem',
                fontWeight: 600,
                gap: '8px',
                textDecoration: 'none'
              }}
            >
              <Play size={14} fill="currentColor" />
              <span>Explore Interactive Demo</span>
            </a>
          </div>

          {/* Feature Highlights Pills */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={14} color="var(--green-light)" /> Zero server uploads
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={14} color="var(--green-light)" /> Multi-format Excel, CSV, JSON
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--green-light)' }}>
              <CheckCircle2 size={14} color="var(--green-light)" /> Gemini 2.5 Flash built-in
            </span>
          </div>
        </div>

        {/* Right Column: 3D Particle Sphere Canvas */}
        <div style={{
          width: '100%',
          height: '520px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ParticleSphere />
          
          {/* Subtle Floating Glass Metric Badge */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '20px',
            background: 'rgba(14, 16, 23, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 18px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 1s ease'
          }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: 'var(--cyan-light)', boxShadow: '0 0 10px var(--cyan-glow)'
            }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Engine Status</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>SQLite WASM 0ms Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── METRICS & ARCHITECTURE STRIP ─── */}
      <section id="architecture" style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(10, 12, 18, 0.5)',
        padding: '30px 40px',
      }}>
        <div style={{
          maxWidth: '1380px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px',
        }}>
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
              99.4%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Natural Language SQL accuracy with Gemini 2.5
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--cyan-light)', letterSpacing: '-0.03em' }}>
              300%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Faster data analysis & reporting workflows
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-light)', letterSpacing: '-0.03em' }}>
              0ms
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Local query latency via in-memory SQLite WASM
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--green-light)', letterSpacing: '-0.03em' }}>
              100%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Client-side privacy. Data never leaves your device.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
              5+
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Supported formats (Excel, CSV, JSON, SQL, DB)
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE DEMO PLAYGROUND ─── */}
      <section id="demo" style={{
        maxWidth: '1380px',
        margin: '0 auto',
        padding: '90px 40px 60px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '12px', padding: '4px 12px', fontSize: '0.74rem' }}>
            Live Interactive Simulator
          </span>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
            Experience natural language database queries.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Click an example query below to see how BolDB transforms conversational prompts into production SQL.
          </p>
        </div>

        {/* Demo Stage Container */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}>
          {/* Query Selector Bar */}
          <div style={{
            padding: '16px 24px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-light)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Interactive Prompt:
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.keys(demoResults).map((query) => (
                <button
                  key={query}
                  onClick={() => setActiveDemoQuery(query)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: activeDemoQuery === query ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: activeDemoQuery === query ? 'var(--accent)' : 'var(--bg-card)',
                    color: activeDemoQuery === query ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  {query}
                </button>
              ))}
            </div>

            <button
              onClick={onLaunchStudio}
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
            >
              Open in Studio <ArrowRight size={12} />
            </button>
          </div>

          {/* Generated SQL HUD */}
          <div style={{ padding: '16px 24px', background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Terminal size={13} color="var(--cyan-light)" />
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI Generated SQL Statement
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>0.4ms Execution</span>
            </div>
            <pre className="mono" style={{
              margin: 0,
              fontSize: '0.84rem',
              color: '#38bdf8',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5
            }}>
              {activeData.sql}
            </pre>
          </div>

          {/* Result Table Preview */}
          <div style={{ padding: '20px 24px' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Category / Customer</th>
                  <th>Total Revenue / Amount</th>
                  <th>Volume / Rating</th>
                </tr>
              </thead>
              <tbody>
                {activeData.rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{row.name}</td>
                    <td style={{ color: 'var(--cyan-light)', fontWeight: 600 }}>{row.spent}</td>
                    <td><span className="badge badge-purple">{row.orders} orders</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" style={{
        maxWidth: '1380px',
        margin: '0 auto',
        padding: '70px 40px 100px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
            Everything you need for autonomous data exploration.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Engineered with modern architecture: WebAssembly, Google Gemini 2.5, and client-side privacy.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {/* Feature 1 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-bg)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <Sparkles size={20} color="var(--accent-light)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Natural Language SQL
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Convert human conversational prompts into optimized SQL statements with automated error recovery and safety guards.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'var(--cyan-bg)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <Cpu size={20} color="var(--cyan-light)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              In-Browser SQLite WASM
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Zero backend database servers required. Queries execute locally in WebAssembly with sub-millisecond query latency.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'var(--green-bg)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <FileSpreadsheet size={20} color="var(--green-light)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Universal File Ingestion
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Drag & drop Excel workbooks (.xlsx, .xlsm), JSON collections, CSV files, SQL dumps, or raw SQLite databases instantly.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'var(--pink-bg)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '1px solid rgba(236, 72, 153, 0.3)'
            }}>
              <BarChart3 size={20} color="var(--pink-light)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Instant Visualizations
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Automatic chart suggestion engine. Generates bar charts, trend lines, glowing area graphs, and donut distributions.
            </p>
          </div>

          {/* Feature 5 (Privacy & Security) */}
          <div id="security" style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'var(--amber-bg)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <Lock size={20} color="var(--amber-light)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Client-Side Privacy
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Your database records are stored only in your browser memory. Only sanitized schema headers are transmitted to the AI.
            </p>
          </div>

          {/* Feature 6 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <Layers size={20} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Rollback & Cell Editing
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Double-click any cell in the Data Grid to edit values live. Rollback snapshots let you undo any mutation with 1 click.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1380px',
        margin: '0 auto',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="var(--accent-light)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>BolDB</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '10px' }}>
            © 2026 BolDB Inc. All rights reserved.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={onLaunchStudio} className="btn btn-ghost btn-xs" style={{ color: 'var(--text-secondary)' }}>
            Launch Studio
          </button>
          <button onClick={onOpenSignIn} className="btn btn-ghost btn-xs" style={{ color: 'var(--text-secondary)' }}>
            Sign In
          </button>
          <button onClick={onOpenSignUp} className="btn btn-ghost btn-xs" style={{ color: 'var(--text-secondary)' }}>
            Sign Up
          </button>
        </div>
      </footer>
    </div>
  );
};
