import {
  ComposedChart, LineChart, BarChart, AreaChart,
  Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ChartSpec } from "../data/layers";

export default function Chart({ spec }: { spec: ChartSpec }) {
  const axisStyle = { fontSize: 11, fontFamily: "Inter", fill: "#6B7280" };
  const tooltip = (
    <Tooltip
      cursor={{ fill: "rgba(27,42,78,0.04)", stroke: "rgba(27,42,78,0.15)" }}
      contentStyle={{
        background: "#FFFFFF", border: "1px solid #E5E2D8", borderRadius: 4,
        fontSize: 12, fontFamily: "Inter", padding: "8px 10px",
      }}
      labelStyle={{ color: "#1B2A4E", fontWeight: 600, marginBottom: 4 }}
    />
  );
  const legend = <Legend iconType="line" wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />;
  const grid = <CartesianGrid stroke="#E5E2D8" strokeDasharray="2 4" vertical={false} />;
  const xAxis = (
    <XAxis dataKey={spec.xKey} tick={axisStyle} stroke="#CFCABB"
           tickLine={false} axisLine={{ stroke: "#CFCABB" }} />
  );
  const yAxis = (
    <YAxis tick={axisStyle} stroke="#CFCABB"
           tickLine={false} axisLine={false} width={48}
           label={spec.yLabel ? { value: spec.yLabel, angle: -90, position: "insideLeft",
             offset: 8, style: { fontSize: 10, fill: "#6B7280", fontFamily: "Inter" } } : undefined } />
  );

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        {spec.kind === "composed" ? (
          <ComposedChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}
            {spec.series.map(s => s.type === "bar"
              ? <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} barSize={44} />
              : <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color}
                      strokeWidth={2} dot={{ r: 3, fill: s.color }} strokeDasharray="4 4" />
            )}
          </ComposedChart>
        ) : spec.kind === "line" ? (
          <LineChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}
            {spec.series.map(s => (
              <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color}
                    strokeWidth={2} dot={{ r: 2.5, fill: s.color }} connectNulls />
            ))}
          </LineChart>
        ) : spec.kind === "bar" ? (
          <BarChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}
            {spec.series.map(s => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} barSize={spec.data.length > 6 ? 16 : 32} />
            ))}
          </BarChart>
        ) : spec.kind === "stacked-bar" ? (
          <BarChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}
            {spec.series.map(s => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} barSize={36} />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={spec.data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              {spec.series.map(s => (
                <linearGradient id={`g-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {grid}{xAxis}{yAxis}{tooltip}{legend}
            {spec.series.map(s => (
              <Area key={s.key} dataKey={s.key} name={s.name} stroke={s.color}
                    strokeWidth={2} fill={`url(#g-${s.key})`} />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
