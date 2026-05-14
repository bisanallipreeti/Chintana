import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Line, Polyline, Rect } from "react-native-svg";
import { EmptyState } from "../../src/components/EmptyState";
import { LoadingState } from "../../src/components/LoadingState";
import { useAppContext } from "../../src/context/AppContext";
import { palette } from "../../src/theme/colors";

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

type StabilityPoint = {
  date: string;
  score: number;
  weekKey?: string;
};

const DISTRIBUTION_COLORS: Record<string, string> = {
  Constructive: "#10B981",
  Destructive: "#EF4444",
  Neutral: "#F59E0B",
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const { user, dashboard, thoughts, isBootstrapping, refreshSession } = useAppContext();

  useFocusEffect(
    useCallback(() => {
      void refreshSession();
    }, []),
  );

  const distribution = useMemo(() => dashboard?.thoughtDistribution || [], [dashboard]);

  const dailySeries = useMemo<StabilityPoint[]>(() => {
    if (dashboard?.dailyStabilitySeries?.length) {
      return dashboard.dailyStabilitySeries.map((item) => ({
        date: item.date,
        score: item.score,
        weekKey: item.weekKey,
      }));
    }

    return (dashboard?.weeklyCognitiveStability || [])
      .filter((item) => item.score !== null)
      .map((item) => ({
        date: item.date,
        score: item.score as number,
      }));
  }, [dashboard]);

  const chartWidth = Math.max(280, Math.min(720, width - 70));

  if (isBootstrapping) {
    return <LoadingState label="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refreshSession()} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.profile?.fullName || user?.fullName}</Text>
        <Text style={styles.subtitle}>Your cognitive wellness dashboard</Text>
      </View>

      <View style={styles.row}>
        <MetricCard
          label="Total Thoughts"
          value={String(dashboard?.totalThoughts ?? thoughts.length)}
          accent="#DBEAFE"
        />
        <MetricCard
          label="Average Score"
          value={
            dashboard?.averageCognitiveScore !== null && dashboard?.averageCognitiveScore !== undefined
              ? String(dashboard?.averageCognitiveScore)
              : "-"
          }
          accent="#DCFCE7"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Stability Trend</Text>
        <Text style={styles.cardHint}>Average cognitive score per day, grouped by week.</Text>
        {dailySeries.length === 0 ? (
          <Text style={styles.cardHint}>No data yet.</Text>
        ) : (
          <View style={styles.chartWrap}>
            <StabilityChart data={dailySeries} width={chartWidth} />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thought Distribution</Text>
        {distribution.length === 0 ? (
          <Text style={styles.cardHint}>No data yet.</Text>
        ) : (
          <View style={styles.pieSection}>
            <DistributionDonut data={distribution} />
            <View style={styles.legendWrap}>
              {distribution.map((item) => (
                <View key={item.name} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: DISTRIBUTION_COLORS[item.name] || palette.slate400 }]} />
                  <Text style={styles.legendLabel}>{item.name}</Text>
                  <Text style={styles.legendValue}>
                    {item.count} ({item.value ?? 0}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.recentHeader}>
          <Text style={styles.cardTitle}>Recent Thoughts</Text>
          <TouchableOpacity onPress={() => router.push("/(app)/history")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        {(dashboard?.latestThoughts?.length || thoughts.length) === 0 ? (
          <EmptyState
            title="No thoughts yet"
            description="Add your first thought to start analytics and reminders."
            actionLabel="Add Thought"
            onAction={() => router.push("/(app)/add-thought")}
          />
        ) : (
          (dashboard?.latestThoughts || thoughts.slice(0, 5)).map((thought) => (
            <TouchableOpacity
              key={thought.id}
              style={styles.thoughtRow}
              onPress={() => router.push(`/analysis/${thought.id}`)}
            >
              <View style={styles.thoughtMain}>
                <Text numberOfLines={2} style={styles.thoughtText}>{thought.text}</Text>
                <Text style={styles.thoughtMeta}>{thought.category} | {thought.type}</Text>
                <Text style={styles.thoughtTime}>{formatTime(thought.createdAt)}</Text>
              </View>
              <Text style={styles.thoughtScore}>{thought.score}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: accent }]}> 
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function StabilityChart({ data, width }: { data: StabilityPoint[]; width: number }) {
  const height = 230;
  const paddingX = 18;
  const paddingY = 16;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  const points = data.map((item, index) => {
    const x = data.length > 1 ? paddingX + (index / (data.length - 1)) * plotWidth : paddingX + plotWidth / 2;
    const y = paddingY + ((100 - item.score) / 100) * plotHeight;
    return { ...item, x, y };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const weekBreaks = points
    .map((point, index) => ({ point, index }))
    .filter(({ point, index }) => index > 0 && point.weekKey && data[index - 1]?.weekKey !== point.weekKey);

  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill={palette.white} rx={12} />
      {[0, 25, 50, 75, 100].map((score) => {
        const y = paddingY + ((100 - score) / 100) * plotHeight;
        return <Line key={score} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke={palette.slate200} strokeWidth={1} />;
      })}

      {weekBreaks.map(({ point, index }) => (
        <Line
          key={`${point.weekKey || "w"}-${index}`}
          x1={point.x}
          x2={point.x}
          y1={paddingY}
          y2={height - paddingY}
          stroke="#D1D5DB"
          strokeDasharray="3,3"
          strokeWidth={1}
        />
      ))}

      {linePoints ? <Polyline points={linePoints} fill="none" stroke={palette.blue} strokeWidth={3} /> : null}
      {points.map((point, index) => (
        <Circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r={3.5} fill={palette.blue} />
      ))}
    </Svg>
  );
}

function DistributionDonut({ data }: { data: Array<{ name: string; count: number; value: number | null }> }) {
  const size = 180;
  const center = size / 2;
  const radius = 56;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={palette.slate200} strokeWidth={strokeWidth} fill="none" />
      </Svg>
    );
  }

  let cumulative = 0;

  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} stroke={palette.slate200} strokeWidth={strokeWidth} fill="none" />
      {data.map((item) => {
        const ratio = item.count / total;
        const segment = ratio * circumference;
        const offset = circumference - cumulative;
        cumulative += segment;

        return (
          <Circle
            key={item.name}
            cx={center}
            cy={center}
            r={radius}
            stroke={DISTRIBUTION_COLORS[item.name] || palette.slate400}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={`${segment} ${circumference}`}
            strokeDashoffset={offset}
            rotation={-90}
            originX={center}
            originY={center}
          />
        );
      })}
      <Circle cx={center} cy={center} r={35} fill={palette.white} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  header: {
    gap: 2,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 25,
    fontWeight: "800",
    color: palette.slate900,
  },
  subtitle: {
    color: palette.slate500,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  metricLabel: {
    color: palette.slate700,
    fontSize: 12,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.slate900,
    marginTop: 4,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.slate200,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: palette.slate900,
    fontSize: 17,
    fontWeight: "700",
  },
  cardHint: {
    color: palette.slate500,
  },
  chartWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  pieSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  legendWrap: {
    flex: 1,
    minWidth: 160,
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendLabel: {
    flex: 1,
    color: palette.slate700,
    fontWeight: "600",
  },
  legendValue: {
    color: palette.slate900,
    fontWeight: "700",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: {
    color: palette.blue,
    fontWeight: "700",
  },
  thoughtRow: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  thoughtMain: {
    flex: 1,
    gap: 2,
  },
  thoughtText: {
    color: palette.slate900,
    fontWeight: "600",
  },
  thoughtMeta: {
    color: palette.slate500,
    fontSize: 12,
  },
  thoughtTime: {
    color: palette.slate400,
    fontSize: 11,
  },
  thoughtScore: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.slate900,
  },
});
