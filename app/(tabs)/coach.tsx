import ActionCard from '@/components/coach/ActionCard';
import Gauge from '@/components/coach/Gauge';
import InsightBullet from '@/components/coach/InsightBullet';
import RankedCard from '@/components/coach/RankedCard';
import SplitTable from '@/components/coach/SplitTable';
import GradientBackground from '@/components/GradientBackground';
import Loading from '@/components/Loading';
import { coachData } from '@/constants/coachData';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type TabType = 'lastMonth' | 'thisWeek';

const BACKEND_URL = 'http://10.159.6.229:3000';

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
  const [lastMonthData, setLastMonthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'lastMonth') {
      fetchLastMonthData();
    }
  }, [activeTab]);

  const fetchLastMonthData = async () => {
    try {
      setIsLoading(true);
      
      if (!supabase) {
        console.error('Supabase not initialized');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/ai/lastMonth?user_id=${user.id}`);
      const result = await response.json();
      
      if (result.success) {
        setLastMonthData(result.data);
        console.log('✅ Fetched last month data:', result.data);
      }
    } catch (error) {
      console.error('Error fetching last month data:', error);
      // Fallback to static data
      setLastMonthData(coachData.lastMonth);
    } finally {
      setIsLoading(false);
    }
  };

  const isLastMonth = activeTab === 'lastMonth';
  const currentData = isLastMonth ? (lastMonthData || coachData.lastMonth) : coachData.thisWeek;
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
        {/* <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity> */}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : (
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TOP SPENDING</Text>
              </View>

              {lastMonthData.rankedCategories && lastMonthData.rankedCategories.length > 0 ? (
                <View style={styles.rankedCardsGrid}>
                  {lastMonthData.rankedCategories[0] && (
                    <View style={styles.fullWidthCard}>
                      <RankedCard {...lastMonthData.rankedCategories[0]} isCenter />
                    </View>
                  )}
                  <View style={styles.twoColumnRow}>
                    {lastMonthData.rankedCategories[1] && (
                      <View style={styles.halfCard}>
                        <RankedCard {...lastMonthData.rankedCategories[1]} />
                      </View>
                    )}
                    {lastMonthData.rankedCategories[2] && (
                      <View style={styles.halfCard}>
                        <RankedCard {...lastMonthData.rankedCategories[2]} />
                      </View>
                    )}
                  </View>
                </View>
              ) : null}

              {lastMonthData.spendingSplit && lastMonthData.spendingSplit.length > 0 ? (
                <SplitTable
                  data={lastMonthData.spendingSplit}
                  caption="Your wants spending ate into your potential savings last month."
                />
              ) : null}

              <View style={styles.coachNoteSection}>
                <View style={styles.coachNoteHeader}>
                  <View style={styles.coachIconContainer}>
                    <Text style={styles.coachIcon}>✨</Text>
                  </View>
                  <Text style={styles.coachNoteTitle}>Coach's Note</Text>
                </View>
                
                <View style={styles.insightsContainer}>
                  {lastMonthData.insights.map((insight: string, index: number) => (
                    <InsightBullet key={index} text={insight} icon={index === 0 ? '💡' : '🛍️'} />
                  ))}
                </View>

                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Generate Action Plan</Text>
                </TouchableOpacity>
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
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  segmentTextActive: {
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  rankedCardsGrid: {
    marginBottom: 32,
    gap: 10,
  },
  fullWidthCard: {
    width: '100%',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCard: {
    flex: 1,
    minWidth: 0,
  },
  coachNoteSection: {
    backgroundColor: 'rgba(0, 82, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 255, 0.1)',
    marginBottom: 32,
  },
  coachNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0052FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachIcon: {
    fontSize: 18,
  },
  coachNoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0052FF',
  },
  insightsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#0052FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
