/**
 * Portfolio Generator - Generates pilot portfolio HTML from flight data
 * Creates a shareable pilot portfolio showcasing flight experience
 */

import type { ParsedFlight } from "@/lib/import/types";

/**
 * Determines the logbook owner's name from flight data
 * The logbook owner is the person who:
 * 1. Has instructor time logged (asFlightInstructor) - they're the instructor building hours
 * 2. Has the most PIC time logged - they're flying as PIC
 * 3. Appears most frequently in copilot/student column when receiving dual - they're the student
 * 
 * We weight by hours to find who this logbook actually belongs to
 */
export function determineLogbookOwner(flights: ParsedFlight[]): string {
  const nameScores = new Map<string, number>();
  
  for (const flight of flights) {
    // If someone logs instructor time, they're building their hours as instructor
    // The instructor is the logbook owner in this case
    if (flight.asFlightInstructor && flight.asFlightInstructor > 0) {
      // When logging instructor time, the instructor (logbook owner) could be:
      // - Listed as PIC
      // - Listed as copilot/student (in some formats)
      // Most likely the PIC when instructing
      if (flight.pilotInCommand) {
        const name = flight.pilotInCommand.toUpperCase().trim();
        const current = nameScores.get(name) ?? 0;
        // Heavy weight for instructor time - this is a strong signal
        nameScores.set(name, current + (flight.asFlightInstructor * 3));
      }
    }
    
    // PIC time - the person flying as PIC is building their hours
    const picHours = (flight.seDayPic ?? 0) + (flight.seNightPic ?? 0) +
      (flight.meDayPic ?? 0) + (flight.meNightPic ?? 0) +
      (flight.xcDayPic ?? 0) + (flight.xcNightPic ?? 0);
    
    if (picHours > 0 && flight.pilotInCommand) {
      const name = flight.pilotInCommand.toUpperCase().trim();
      const current = nameScores.get(name) ?? 0;
      nameScores.set(name, current + picHours);
    }
    
    // Dual received - the student receiving instruction is the logbook owner
    // They would be listed in copilot/student column
    if (flight.dualReceived && flight.dualReceived > 0) {
      if (flight.copilotOrStudent) {
        const name = flight.copilotOrStudent.toUpperCase().trim();
        const current = nameScores.get(name) ?? 0;
        // Heavy weight for dual received - strong signal this is the student's logbook
        nameScores.set(name, current + (flight.dualReceived * 2));
      }
    }
  }
  
  // Find the name with highest score
  let maxScore = 0;
  let owner = "Pilot";
  
  for (const [name, score] of nameScores.entries()) {
    if (score > maxScore && name.length > 0) {
      maxScore = score;
      owner = name;
    }
  }
  
  // Format name nicely (Title Case)
  return owner.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Aggregated statistics for pilot portfolio display
 */
export interface PilotPortfolioStats {
  // Total hours
  totalFlightHours: number;
  picHours: number;
  instructorHours: number;
  dualReceivedHours: number;
  
  // Time categories
  singleEngineDayHours: number;
  singleEngineNightHours: number;
  multiEngineDayHours: number;
  multiEngineNightHours: number;
  crossCountryHours: number;
  nightFlyingHours: number;
  
  // Instrument
  actualImcHours: number;
  hoodHours: number;
  simulatorHours: number;
  ifrApproaches: number;
  
  // Counts
  totalFlights: number;
  dayTakeoffsLandings: number;
  nightTakeoffsLandings: number;
  
  // Aircraft types flown
  aircraftTypes: Map<string, number>;
  
  // Date range
  firstFlightDate: Date | null;
  lastFlightDate: Date | null;
}

/**
 * Calculate pilot statistics from flight data
 */
export function calculatePortfolioStats(flights: ParsedFlight[]): PilotPortfolioStats {
  const stats: PilotPortfolioStats = {
    totalFlightHours: 0,
    picHours: 0,
    instructorHours: 0,
    dualReceivedHours: 0,
    singleEngineDayHours: 0,
    singleEngineNightHours: 0,
    multiEngineDayHours: 0,
    multiEngineNightHours: 0,
    crossCountryHours: 0,
    nightFlyingHours: 0,
    actualImcHours: 0,
    hoodHours: 0,
    simulatorHours: 0,
    ifrApproaches: 0,
    totalFlights: flights.length,
    dayTakeoffsLandings: 0,
    nightTakeoffsLandings: 0,
    aircraftTypes: new Map(),
    firstFlightDate: null,
    lastFlightDate: null,
  };
  
  for (const flight of flights) {
    // Total hours
    stats.totalFlightHours += flight.flightHours;
    
    // PIC hours (sum of all PIC columns)
    stats.picHours += (flight.seDayPic ?? 0) + (flight.seNightPic ?? 0) +
      (flight.meDayPic ?? 0) + (flight.meNightPic ?? 0) +
      (flight.xcDayPic ?? 0) + (flight.xcNightPic ?? 0);
    
    // Instructor and dual
    stats.instructorHours += flight.asFlightInstructor ?? 0;
    stats.dualReceivedHours += flight.dualReceived ?? 0;
    
    // Single engine
    stats.singleEngineDayHours += (flight.seDayDual ?? 0) + (flight.seDayPic ?? 0) + (flight.seDayCopilot ?? 0);
    stats.singleEngineNightHours += (flight.seNightDual ?? 0) + (flight.seNightPic ?? 0) + (flight.seNightCopilot ?? 0);
    
    // Multi engine
    stats.multiEngineDayHours += (flight.meDayDual ?? 0) + (flight.meDayPic ?? 0) + (flight.meDayCopilot ?? 0);
    stats.multiEngineNightHours += (flight.meNightDual ?? 0) + (flight.meNightPic ?? 0) + (flight.meNightCopilot ?? 0);
    
    // Cross country
    stats.crossCountryHours += (flight.xcDayDual ?? 0) + (flight.xcDayPic ?? 0) + (flight.xcDayCopilot ?? 0) +
      (flight.xcNightDual ?? 0) + (flight.xcNightPic ?? 0) + (flight.xcNightCopilot ?? 0);
    
    // Night flying
    stats.nightFlyingHours += (flight.seNightDual ?? 0) + (flight.seNightPic ?? 0) + (flight.seNightCopilot ?? 0) +
      (flight.meNightDual ?? 0) + (flight.meNightPic ?? 0) + (flight.meNightCopilot ?? 0);
    
    // Instrument
    stats.actualImcHours += flight.actualImc ?? 0;
    stats.hoodHours += flight.hood ?? 0;
    stats.simulatorHours += flight.simulator ?? 0;
    stats.ifrApproaches += flight.ifrApproaches ?? 0;
    
    // Takeoffs/landings
    stats.dayTakeoffsLandings += flight.dayTakeoffsLandings ?? 0;
    stats.nightTakeoffsLandings += flight.nightTakeoffsLandings ?? 0;
    
    // Aircraft types
    if (flight.aircraftMakeModel) {
      const current = stats.aircraftTypes.get(flight.aircraftMakeModel) ?? 0;
      stats.aircraftTypes.set(flight.aircraftMakeModel, current + flight.flightHours);
    }
    
    // Date range
    if (!stats.firstFlightDate || flight.flightDate < stats.firstFlightDate) {
      stats.firstFlightDate = flight.flightDate;
    }
    if (!stats.lastFlightDate || flight.flightDate > stats.lastFlightDate) {
      stats.lastFlightDate = flight.flightDate;
    }
  }
  
  return stats;
}

/**
 * Generate portfolio HTML with pilot data
 */
export function generatePortfolioHtml(stats: PilotPortfolioStats, pilotName: string = "Pilot"): string {
  // Sort aircraft by hours (descending)
  const sortedAircraft = Array.from(stats.aircraftTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Top 6 aircraft
  
  const formatHours = (hours: number) => hours.toFixed(1);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pilotName} - Professional Pilot Portfolio</title>
    <style>
        :root {
            --primary: #9333ea;
            --primary-dark: #7c22ce;
            --dark-bg: #1a1a2e;
            --darker-bg: #0f0f23;
            --mid-bg: #16213e;
            --card-bg: rgba(255, 255, 255, 0.05);
            --card-border: rgba(255, 255, 255, 0.1);
            --text-primary: #ffffff;
            --text-secondary: rgba(255, 255, 255, 0.8);
            --text-muted: rgba(255, 255, 255, 0.6);
            --accent: #a855f7;
            --success: #22c55e;
            --warning: #f59e0b;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, var(--darker-bg) 0%, var(--mid-bg) 50%, var(--dark-bg) 100%);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Hero Section */
        .hero {
            text-align: center;
            padding: 4rem 2rem;
            background: linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%);
            border-radius: 24px;
            border: 1px solid var(--card-border);
            margin-bottom: 3rem;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 70%);
            pointer-events: none;
        }

        .hero-content {
            position: relative;
            z-index: 1;
        }

        .pilot-name {
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        }

        .pilot-title {
            font-size: 1.25rem;
            color: var(--text-secondary);
            margin-bottom: 1rem;
        }

        .date-range {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-top: 1rem;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.25rem;
            margin-bottom: 3rem;
        }

        .stat-card {
            background: var(--card-bg);
            padding: 1.75rem;
            border-radius: 16px;
            border: 1px solid var(--card-border);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
        }

        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(147, 51, 234, 0.2);
            border-color: var(--primary);
        }

        .stat-label {
            font-size: 0.85rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
        }

        .stat-value {
            font-size: 2.25rem;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 0.25rem;
        }

        .stat-subtitle {
            font-size: 0.8rem;
            color: var(--text-secondary);
        }

        /* Section Headers */
        .section-header {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            position: relative;
            padding-left: 1.25rem;
        }

        .section-header::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 80%;
            background: linear-gradient(180deg, var(--primary) 0%, var(--accent) 100%);
            border-radius: 2px;
        }

        /* Aircraft Experience Grid */
        .aircraft-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
        }

        .aircraft-card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid var(--card-border);
            text-align: center;
            transition: all 0.3s ease;
        }

        .aircraft-card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
        }

        .aircraft-name {
            font-size: 1rem;
            font-weight: 600;
            color: var(--accent);
            margin-bottom: 0.5rem;
        }

        .aircraft-hours {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }

        .aircraft-subtitle {
            font-size: 0.8rem;
            color: var(--text-muted);
        }

        /* Flight Summary Cards */
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.25rem;
            margin-bottom: 3rem;
        }

        .summary-card {
            background: var(--card-bg);
            padding: 1.75rem;
            border-radius: 16px;
            border: 1px solid var(--card-border);
        }

        .summary-card-title {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .summary-items {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .summary-item:last-child {
            border-bottom: none;
        }

        .summary-item-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .summary-item-value {
            color: var(--accent);
            font-weight: 600;
            font-size: 0.9rem;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
            font-size: 0.85rem;
        }

        .footer a {
            color: var(--accent);
            text-decoration: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .pilot-name {
                font-size: 2rem;
            }

            .pilot-title {
                font-size: 1rem;
            }

            .section-header {
                font-size: 1.25rem;
            }

            .stat-value {
                font-size: 1.75rem;
            }
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .stat-card, .aircraft-card, .summary-card {
            animation: fadeInUp 0.6s ease forwards;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.15s; }
        .stat-card:nth-child(3) { animation-delay: 0.2s; }
        .stat-card:nth-child(4) { animation-delay: 0.25s; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Hero Section -->
        <div class="hero">
            <div class="hero-content">
                <h1 class="pilot-name">${pilotName.toUpperCase()}</h1>
                <p class="pilot-title">Professional Pilot Portfolio</p>
                ${stats.firstFlightDate && stats.lastFlightDate ? `
                <p class="date-range">
                    Flight history: ${stats.firstFlightDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                    ${stats.lastFlightDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>` : ''}
            </div>
        </div>

        <!-- Key Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Flight Hours</div>
                <div class="stat-value">${formatHours(stats.totalFlightHours)}</div>
                <div class="stat-subtitle">${stats.totalFlights} flights logged</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">PIC Hours</div>
                <div class="stat-value">${formatHours(stats.picHours)}</div>
                <div class="stat-subtitle">Pilot in command</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Instructor Hours</div>
                <div class="stat-value">${formatHours(stats.instructorHours)}</div>
                <div class="stat-subtitle">As flight instructor</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Cross-Country</div>
                <div class="stat-value">${formatHours(stats.crossCountryHours)}</div>
                <div class="stat-subtitle">Navigation hours</div>
            </div>
        </div>

        <!-- Flight Experience Breakdown -->
        <h2 class="section-header">Flight Experience Overview</h2>
        <div class="summary-cards">
            <div class="summary-card">
                <div class="summary-card-title">Flight Time Categories</div>
                <div class="summary-items">
                    <div class="summary-item">
                        <span class="summary-item-label">Single-Engine Day</span>
                        <span class="summary-item-value">${formatHours(stats.singleEngineDayHours)} hrs</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">Multi-Engine Day</span>
                        <span class="summary-item-value">${formatHours(stats.multiEngineDayHours)} hrs</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">Night Flying</span>
                        <span class="summary-item-value">${formatHours(stats.nightFlyingHours)} hrs</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">Instrument (Actual IMC)</span>
                        <span class="summary-item-value">${formatHours(stats.actualImcHours)} hrs</span>
                    </div>
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-card-title">Instrument & Advanced</div>
                <div class="summary-items">
                    <div class="summary-item">
                        <span class="summary-item-label">Hood Time</span>
                        <span class="summary-item-value">${formatHours(stats.hoodHours)} hrs</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">Simulator</span>
                        <span class="summary-item-value">${formatHours(stats.simulatorHours)} hrs</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">IFR Approaches</span>
                        <span class="summary-item-value">${stats.ifrApproaches}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">Day Takeoffs/Landings</span>
                        <span class="summary-item-value">${stats.dayTakeoffsLandings}</span>
                    </div>
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-card-title">Training & Experience</div>
                <div class="summary-items">
                    <div class="summary-item">
                        <span class="summary-item-label">Dual Received</span>
                        <span class="summary-item-value">${formatHours(stats.dualReceivedHours)} hrs</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">As Flight Instructor</span>
                        <span class="summary-item-value">${formatHours(stats.instructorHours)} hrs</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">Night Takeoffs/Landings</span>
                        <span class="summary-item-value">${stats.nightTakeoffsLandings}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-item-label">Cross-Country PIC</span>
                        <span class="summary-item-value">${formatHours(stats.crossCountryHours)} hrs</span>
                    </div>
                </div>
            </div>
        </div>

        ${sortedAircraft.length > 0 ? `
        <!-- Aircraft Experience -->
        <h2 class="section-header">Aircraft Experience</h2>
        <div class="aircraft-grid">
            ${sortedAircraft.map(([name, hours]) => `
            <div class="aircraft-card">
                <div class="aircraft-name">${name}</div>
                <div class="aircraft-hours">${formatHours(hours)}</div>
                <div class="aircraft-subtitle">hours</div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>Generated by <a href="#">Digital Pilot Logbook</a></p>
        </div>
    </div>
</body>
</html>`;
}
