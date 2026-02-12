import ActionCard from '@/components/coach/ActionCard';
import Gauge from '@/components/coach/Gauge';
import InsightBullet from '@/components/coach/InsightBullet';
import RankedCard from '@/components/coach/RankedCard';
import SplitTable from '@/components/coach/SplitTable';
import GradientBackground from '@/components/GradientBackground';
import { coachData } from '@/constants/coachData';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TabType = 'lastMonth' | 'thisWeek';

export default function CoachTab() {
  const [activeTab, setActiveTab] = useState<TabType>('lastMonth');
  const [activeLimits, setActiveLimits] = useState<{
    food: boolean;
    subscriptions: boolean;
    cabs: boolean;
  }>({
    food: false,
    subscriptions: false,
    cabs: false,
  });

  const isLastMonth = activeTab === 'lastMonth';
  const currentData = coachData[activeTab];
  const lastMonthData = isLastMonth ? coachData.lastMonth : null;
  const thisWeekData = !isLastMonth ? coachData.thisWeek : null;

  const handleSetLimit = (category: 'food' | 'subscriptions' | 'cabs') => {
    setActiveLimits(prev => ({
      ...prev,
      [category]: true,
    }));
  };

  return (
    <GradientBackground>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coach</Text>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Gauge status={currentData.status as 'OK' | 'Good' | 'Great'} />

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'lastMonth' && styles.segmentActive]}
            onPress={() => setActiveTab('lastMonth')}
          >
            <Text style={[styles.segmentText, activeTab === 'lastMonth' && styles.segmentTextActive]}>
              Last Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'thisWeek' && styles.segmentActive]}
            onPress={() => setActiveTab('thisWeek')}
          >
            <Text style={[styles.segmentText, activeTab === 'thisWeek' && styles.segmentTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
        </View>

        {isLastMonth && lastMonthData ? (
          <>
            <View style={styles.rankedCardsContainer}>
              <View style={styles.sideCard}>
                <RankedCard {...lastMonthData.rankedCategories[1]} />
              </View>
              <View style={styles.centerCard}>
                <RankedCard {...lastMonthData.rankedCategories[0]} isCenter />
              </View>
              <View style={styles.sideCard}>
                <RankedCard {...lastMonthData.rankedCategories[2]} />
              </View>
            </View>

            <View style={styles.insightsSection}>
              {lastMonthData.insights.map((insight: string, index: number) => (
                <InsightBullet key={index} text={insight} />
              ))}
            </View>

            <SplitTable
              data={lastMonthData.spendingSplit}
              caption="Your wants spending ate into your savings last month."
            />

            <View style={styles.summarySection}>
              <Text style={styles.summaryText}>{lastMonthData.summary}</Text>
            </View>
          </>
        ) : thisWeekData ? (
          <>
            <View style={styles.thisWeekSection}>
              {thisWeekData.actions.map((action: any) => (
                <ActionCard
                  key={action.id}
                  emoji={action.emoji}
                  title={action.title}
                  subtitle={action.subtitle}
                  targetAmount={action.targetAmount}
                  currentSpent={action.currentSpent}
                  color={action.color}
                  isActive={activeLimits[action.id as keyof typeof activeLimits]}
                  onSetLimit={() => handleSetLimit(action.id as 'food' | 'subscriptions' | 'cabs')}
                />
              ))}
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryText}>{thisWeekData.summary}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  segmentTextActive: {
    color: '#111827',
  },
  rankedCardsContainer: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  sideCard: {
    flex: 1,
  },
  centerCard: {
    flex: 1,
    marginHorizontal: 8,
  },
  insightsSection: {
    paddingVertical: 24,
  },
  thisWeekSection: {
    paddingVertical: 16,
  },
  summarySection: {
    paddingVertical: 24,
    paddingBottom: 32,
  },
  summaryText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
