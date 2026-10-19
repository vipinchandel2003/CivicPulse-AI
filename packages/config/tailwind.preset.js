module.exports = {
  theme: {
    extend: {
      colors: {
        civic: {
          critical: "#DC2626", // Red 600 - Open manhole, live-wire, high hazard
          high: "#D97706",     // Amber 600 - High priority SLA 12-24h
          standard: "#2563EB", // Blue 600 - Standard priority SLA 48-72h
          success: "#16A34A",  // Green 600 - Resolved, verified
          muted: "#64748B",    // Slate 500
          dark: "#0F172A",     // Slate 900
          light: "#F8FAFC"     // Slate 50
        }
      }
    }
  }
};
