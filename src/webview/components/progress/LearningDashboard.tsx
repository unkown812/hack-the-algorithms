import type { FunctionComponent } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { Achievement, Bookmark } from '../../../core/practice/types';

export interface TopicPerformanceView {
  topicId: string;
  label: string;
  attempted: number;
  correct: number;
  accuracy: number;
  status: 'strong' | 'moderate' | 'weak' | 'not-started';
  challengesAttempted: number;
  challengesAccepted: number;
  practicalsCompleted: number;
  lastPracticedAt?: number;
}

export interface ProgressView {
  statistics: {
    algorithmsExplored: number;
    quizzesCompleted: number;
    quizAccuracyTotal: number;
    challengesAttempted: number;
    challengesAccepted: number;
    questionsAnswered: number;
    questionsCorrect: number;
    topicsExplored: number;
    practicalsCompleted: number;
    totalSessions: number;
    activityByDay: Record<string, number>;
  };
  performance: {
    topics: TopicPerformanceView[];
    strongTopics: TopicPerformanceView[];
    weakTopics: TopicPerformanceView[];
    frequentMistakes: Array<{ questionId: string; title: string; topic: string; wrongCount: number }>;
    overallAccuracy: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    reason: string;
    priority: number;
    kind: string;
    targetId?: string;
  }>;
  achievements: Array<{ id: string; earnedAt: number }>;
  bookmarks: Bookmark[];
  allAchievements: Achievement[];
}

interface LearningDashboardProps {
  progress: ProgressView | null;
  onReset: () => void;
  onExport: () => void;
}

/**
 * The learning progress dashboard: the statistics, the topic performance, the
 * revision recommendations and the achievements.
 */
export const LearningDashboard: FunctionComponent<LearningDashboardProps> = ({
  progress,
  onReset,
  onExport,
}) => {
  if (!progress) {
    return (
      <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
        Loading your progress…
      </Text>
    );
  }

  const { statistics, performance, recommendations } = progress;

  return (
    <Box style={{ display: 'grid', gap: SPACING.lg }}>
      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: SPACING.md } as React.CSSProperties}>
        <Tile label="Questions answered" value={statistics.questionsAnswered} />
        <Tile label="Overall accuracy" value={`${performance.overallAccuracy} %`} />
        <Tile label="Quizzes completed" value={statistics.quizzesCompleted} />
        <Tile label="Challenges accepted" value={statistics.challengesAccepted} />
        <Tile label="Practicals completed" value={statistics.practicalsCompleted} />
        <Tile label="Topics explored" value={statistics.topicsExplored} />
        <Tile label="Algorithms explored" value={statistics.algorithmsExplored} />
        <Tile label="Learning sessions" value={statistics.totalSessions} />
      </Box>

      <Box
        style={{
          padding: SPACING.lg,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
          Topic progress
        </Text>
        <Box style={{ display: 'grid', gap: SPACING.sm }}>
          {performance.topics.map((topic) => (
            <Box key={topic.topicId}>
              <Flex gap={SPACING.sm} align="center" style={{ marginBottom: 4 } as React.CSSProperties}>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
                  {topic.label}
                </Text>
                <Text
                  as="p"
                  style={{
                    ...TYPOGRAPHY.small,
                    color: statusColor(topic.status),
                    margin: 0,
                    fontSize: '0.72rem',
                    minWidth: 90,
                    textAlign: 'right',
                  }}
                >
                  {topic.attempted === 0
                    ? 'not started'
                    : `${topic.correct}/${topic.attempted} · ${topic.accuracy} %`}
                </Text>
              </Flex>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: COLORS.surfaceElevated,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, topic.accuracy)}%`,
                    height: '100%',
                    backgroundColor: statusColor(topic.status),
                  }}
                />
              </div>
            </Box>
          ))}
        </Box>
      </Box>

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: SPACING.lg } as React.CSSProperties}>
        <Box
          style={{
            padding: SPACING.lg,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.surface,
          }}
        >
          <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
            Recommended revision
          </Text>
          {recommendations.length === 0 ? (
            <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
              Nothing to revise right now — keep practising to build up your statistics.
            </Text>
          ) : (
            <Box style={{ display: 'grid', gap: SPACING.sm }}>
              {recommendations.slice(0, 8).map((recommendation) => (
                <Box
                  key={recommendation.id}
                  style={{
                    padding: SPACING.sm,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.surfaceElevated,
                  }}
                >
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, fontWeight: 600 }}>
                    {recommendation.title}
                  </Text>
                  <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, margin: '0.15rem 0 0 0' }}>
                    {recommendation.reason}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box
          style={{
            padding: SPACING.lg,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.surface,
          }}
        >
          <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
            Achievements
          </Text>
          <Box style={{ display: 'grid', gap: SPACING.xs }}>
            {progress.allAchievements.map((achievement) => {
              const earned = progress.achievements.find((entry) => entry.id === achievement.id);
              return (
                <Flex key={achievement.id} gap={SPACING.sm} align="center">
                  <span style={{ color: earned ? COLORS.success : COLORS.textMuted, fontSize: '0.9rem' }}>
                    {earned ? '★' : '☆'}
                  </span>
                  <Text
                    as="p"
                    style={{
                      ...TYPOGRAPHY.small,
                      color: earned ? COLORS.textPrimary : COLORS.textMuted,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {achievement.name}
                  </Text>
                </Flex>
              );
            })}
          </Box>
        </Box>
      </Box>

      {performance.frequentMistakes.length > 0 && (
        <Box
          style={{
            padding: SPACING.lg,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.surface,
          }}
        >
          <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.75rem 0' }}>
            Frequently incorrect questions
          </Text>
          <Box style={{ display: 'grid', gap: SPACING.xs }}>
            {performance.frequentMistakes.map((mistake) => (
              <Flex key={mistake.questionId} gap={SPACING.sm} align="center">
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textPrimary, margin: 0, flex: 1 }}>
                  {mistake.title}
                </Text>
                <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.error, margin: 0 }}>
                  wrong {mistake.wrongCount}×
                </Text>
              </Flex>
            ))}
          </Box>
        </Box>
      )}

      <Flex gap={SPACING.sm} align="center" style={{ flexWrap: 'wrap' } as React.CSSProperties}>
        <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0, flex: 1 }}>
          All progress data is stored locally on this machine. Nothing is uploaded.
        </Text>
        <Button variant="secondary" size="sm" onClick={onExport}>
          Export the data
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset the progress
        </Button>
      </Flex>
    </Box>
  );
};

function statusColor(status: TopicPerformanceView['status']): string {
  switch (status) {
  case 'strong':
    return COLORS.success;
  case 'weak':
    return COLORS.error;
  case 'moderate':
    return COLORS.warning;
  default:
    return COLORS.textMuted;
  }
}

const Tile: FunctionComponent<{ label: string; value: number | string }> = ({ label, value }) => (
  <Box
    style={{
      padding: SPACING.md,
      borderRadius: RADIUS.lg,
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.surface,
    }}
  >
    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: COLORS.textPrimary }}>{value}</div>
    <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: 0 }}>
      {label}
    </Text>
  </Box>
);
