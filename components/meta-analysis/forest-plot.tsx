"use client";

import type { MetaAnalysisEntryRecord } from "@/lib/validators/meta-analysis";

interface ForestPlotProps {
  entries: MetaAnalysisEntryRecord[];
  /** Whether the scale is log (e.g., OR/RR) or linear (e.g., MD). */
  logScale?: boolean;
}

const PLOT_WIDTH = 700;
const ROW_HEIGHT = 28;
const LABEL_WIDTH = 200;
const STAT_WIDTH = 160;
const PLOT_AREA_WIDTH = PLOT_WIDTH - LABEL_WIDTH - STAT_WIDTH;
const PADDING_TOP = 40;
const PADDING_BOTTOM = 30;

/** Custom SVG forest plot for meta-analysis visualization. */
export function ForestPlot({ entries, logScale = false }: ForestPlotProps) {
  // Filter out entries with NaN/Infinity values
  const validEntries = entries.filter(
    (e) =>
      isFinite(e.effect_size) && isFinite(e.ci_lower) && isFinite(e.ci_upper),
  );

  if (validEntries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {entries.length === 0
          ? "No entries to display. Add study data in the table above."
          : "No valid data to display. All entries contain invalid values."}
      </div>
    );
  }

  const height =
    PADDING_TOP + validEntries.length * ROW_HEIGHT + PADDING_BOTTOM;

  // Compute scale bounds
  const allValues = validEntries.flatMap((e) => [
    e.ci_lower,
    e.ci_upper,
    e.effect_size,
  ]);
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 1;
  const nullValue = logScale ? 0 : 0; // log(1) = 0 for ratios, 0 for differences

  const padding = (dataMax - dataMin) * 0.15 || 0.5;
  const scaleMin = Math.min(dataMin - padding, nullValue - padding);
  const scaleMax = Math.max(dataMax + padding, nullValue + padding);

  /** Convert data value to x position in the plot area. */
  const toX = (value: number): number => {
    const proportion = (value - scaleMin) / (scaleMax - scaleMin);
    return LABEL_WIDTH + proportion * PLOT_AREA_WIDTH;
  };

  const nullLineX = toX(nullValue);

  // Max weight for circle sizing
  const weights = validEntries.map((e) => e.weight ?? 1);
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 1;

  return (
    <svg
      viewBox={`0 0 ${PLOT_WIDTH} ${height}`}
      className="w-full max-w-[700px]"
      style={{ fontFamily: "var(--font-sans, system-ui)" }}
    >
      {/* Header */}
      <text x={4} y={20} fontSize={11} fontWeight="bold" fill="currentColor">
        Study
      </text>
      <text
        x={LABEL_WIDTH + PLOT_AREA_WIDTH / 2}
        y={20}
        fontSize={11}
        fontWeight="bold"
        fill="currentColor"
        textAnchor="middle"
      >
        Effect Size (95% CI)
      </text>
      <text
        x={PLOT_WIDTH - 4}
        y={20}
        fontSize={11}
        fontWeight="bold"
        fill="currentColor"
        textAnchor="end"
      >
        ES [95% CI]
      </text>

      {/* Header line */}
      <line
        x1={0}
        y1={PADDING_TOP - 8}
        x2={PLOT_WIDTH}
        y2={PADDING_TOP - 8}
        stroke="currentColor"
        strokeOpacity={0.2}
      />

      {/* Null effect reference line */}
      <line
        x1={nullLineX}
        y1={PADDING_TOP - 4}
        x2={nullLineX}
        y2={height - PADDING_BOTTOM + 4}
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeDasharray="4,3"
      />

      {/* Study rows */}
      {validEntries.map((entry, i) => {
        const y = PADDING_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2;
        const x1 = toX(entry.ci_lower);
        const x2 = toX(entry.ci_upper);
        const xCenter = toX(entry.effect_size);

        // Circle size based on weight
        const weight = entry.weight ?? 1;
        const radius = 3 + (weight / maxWeight) * 5;

        return (
          <g key={entry.id}>
            {/* Alternating row background */}
            {i % 2 === 0 && (
              <rect
                x={0}
                y={y - ROW_HEIGHT / 2}
                width={PLOT_WIDTH}
                height={ROW_HEIGHT}
                fill="currentColor"
                fillOpacity={0.03}
              />
            )}

            {/* Study label */}
            <text
              x={4}
              y={y + 4}
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.8}
            >
              {entry.study_label.length > 28
                ? entry.study_label.slice(0, 25) + "..."
                : entry.study_label}
            </text>

            {/* CI whisker line */}
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="hsl(210, 80%, 60%)"
              strokeWidth={1.5}
            />

            {/* CI endpoints */}
            <line
              x1={x1}
              y1={y - 4}
              x2={x1}
              y2={y + 4}
              stroke="hsl(210, 80%, 60%)"
              strokeWidth={1.5}
            />
            <line
              x1={x2}
              y1={y - 4}
              x2={x2}
              y2={y + 4}
              stroke="hsl(210, 80%, 60%)"
              strokeWidth={1.5}
            />

            {/* Point estimate circle */}
            <circle
              cx={xCenter}
              cy={y}
              r={radius}
              fill="hsl(210, 80%, 60%)"
              fillOpacity={0.9}
            />

            {/* Numeric values */}
            <text
              x={PLOT_WIDTH - 4}
              y={y + 4}
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.7}
              textAnchor="end"
            >
              {entry.effect_size.toFixed(2)} [{entry.ci_lower.toFixed(2)},{" "}
              {entry.ci_upper.toFixed(2)}]
            </text>
          </g>
        );
      })}

      {/* Bottom axis line */}
      <line
        x1={LABEL_WIDTH}
        y1={height - PADDING_BOTTOM + 4}
        x2={LABEL_WIDTH + PLOT_AREA_WIDTH}
        y2={height - PADDING_BOTTOM + 4}
        stroke="currentColor"
        strokeOpacity={0.2}
      />

      {/* Axis labels */}
      <text
        x={LABEL_WIDTH}
        y={height - 8}
        fontSize={9}
        fill="currentColor"
        fillOpacity={0.5}
      >
        {logScale ? "Favors control" : `${scaleMin.toFixed(1)}`}
      </text>
      <text
        x={nullLineX}
        y={height - 8}
        fontSize={9}
        fill="currentColor"
        fillOpacity={0.5}
        textAnchor="middle"
      >
        {logScale ? "1" : "0"}
      </text>
      <text
        x={LABEL_WIDTH + PLOT_AREA_WIDTH}
        y={height - 8}
        fontSize={9}
        fill="currentColor"
        fillOpacity={0.5}
        textAnchor="end"
      >
        {logScale ? "Favors treatment" : `${scaleMax.toFixed(1)}`}
      </text>
    </svg>
  );
}
