export const plantKpis = [
  { label: "Plant health", value: "86%", meta: "+2.4% vs yesterday" },
  { label: "Assets at risk", value: "2", meta: "1 high priority" },
  { label: "OEE", value: "78.6%", meta: "+1.8 pts this week" },
  { label: "Orders at risk", value: "1", meta: "Vector Mobility" },
];

export const assets = [
  { id: "CNC-01", line: "Line A", status: "healthy", health: 93, issue: "Normal operation" },
  { id: "CNC-02", line: "Line A", status: "watch", health: 72, issue: "Rising spindle vibration" },
  { id: "MOTOR-04", line: "Utilities", status: "risk", health: 47, issue: "Bearing degradation suspected" },
  { id: "DYNO-01", line: "End-of-line", status: "healthy", health: 91, issue: "Normal operation" },
];

export const motorTrend = [
  { day: "Mon", vibration: 1.9, temp: 46, health: 91 },
  { day: "Tue", vibration: 2.2, temp: 48, health: 87 },
  { day: "Wed", vibration: 2.8, temp: 51, health: 81 },
  { day: "Thu", vibration: 3.5, temp: 55, health: 73 },
  { day: "Fri", vibration: 4.2, temp: 59, health: 65 },
  { day: "Sat", vibration: 5.3, temp: 64, health: 56 },
  { day: "Sun", vibration: 7.26, temp: 71.1, health: 46.6 },
];

export const investigation = {
  diagnosis: "Progressive drive-end bearing degradation",
  severity: "High",
  confidence: "88%",
  rootCause: "Bearing wear or lubrication loss is increasing friction and mechanical vibration.",
  evidence: [
    "Peak vibration increased to 7.26 mm/s",
    "Peak housing temperature reached 71.1°C",
    "Health score declined to 46.6/100",
    "Maintenance inspection already flagged VIB-HIGH",
    "Only 4 unreserved bearings remain; primary replenishment is delayed",
  ],
  action:
    "Schedule bearing inspection and replacement at the next safe maintenance window. Reduce load if vibration continues to rise and reserve one bearing before shutdown.",
  impact:
    "Acting before failure can avoid an unplanned utility interruption and reduce cascading production risk.",
};
