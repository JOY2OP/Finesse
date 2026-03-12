import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SplitTableRowProps = {
  category: string;
  goal: string;
  actual: string;
  status: 'good' | 'warning' | 'bad';
  color: string;
  isHeader?: boolean;
};

function SplitTableRow({ category, goal, actual, status, color, isHeader }: SplitTableRowProps) {
  const getStatusIcon = () => {
    if (status === 'good') return '✓';
    if (status === 'warning') return '↗';
    return '↗';
  };

  const getStatusColor = () => {
    if (status === 'good') return '#10B981';
    if (status === 'bad') return '#EF4444';
    return '#64748B';
  };

  return (
    <View style={[
      styles.tableRow,
      isHeader && styles.tableHeaderRow,
      status === 'bad' && styles.tableRowWarning
    ]}>
      <View style={styles.categoryCell}>
        {!isHeader && <View style={[styles.colorDot, { backgroundColor: color }]} />}
        <Text style={[
          styles.categoryText,
          isHeader && styles.headerText
        ]} numberOfLines={1}>
          {category}
        </Text>
      </View>
      <Text style={[
        styles.goalCell,
        isHeader && styles.headerText
      ]} numberOfLines={1}>
        {goal}
      </Text>
      <Text style={[
        styles.actualCell,
        isHeader && styles.headerText,
        !isHeader && styles.actualBold,
        status === 'bad' && styles.actualDanger
      ]} numberOfLines={1}>
        {actual}
      </Text>
      <View style={styles.statusCell}>
        {!isHeader && (
          <Text style={[styles.statusIcon, { color: getStatusColor() }]}>
            {getStatusIcon()}
          </Text>
        )}
        {isHeader && <Text style={styles.headerText}>Diff.</Text>}
      </View>
    </View>
  );
}

type SplitTableProps = {
  data: Array<{ 
    category: string; 
    expected?: string;
    goal?: string;
    actual: string;
    status?: 'good' | 'warning' | 'bad';
    color?: string;
  }>;
  caption: string;
};

export default function SplitTable({ data, caption }: SplitTableProps) {
  const getCategoryColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('need')) return '#3B82F6';
    if (lower.includes('want')) return '#F97316';
    if (lower.includes('saving')) return '#10B981';
    return '#64748B';
  };

  const getStatus = (category: string, actual: string): 'good' | 'warning' | 'bad' => {
    const actualNum = parseInt(actual);
    const lower = category.toLowerCase();
    
    if (lower.includes('want') && actualNum > 30) return 'bad';
    if (lower.includes('need') && actualNum < 50) return 'good';
    if (lower.includes('saving') && actualNum >= 20) return 'good';
    return 'warning';
  };

  return (
    <View style={styles.splitTableSection}>
      <View style={styles.titleRow}>
        <Text style={styles.splitTableTitle}>Spending Split</Text>
        <Text style={styles.ruleLabel}>50/30/20 Rule</Text>
      </View>
      
      <View style={styles.table}>
        <SplitTableRow
          category="Category"
          goal="Goal"
          actual="Actual"
          status="good"
          color="#000"
          isHeader
        />
        {data.map((row, index) => (
          <SplitTableRow
            key={index}
            category={row.category}
            goal={row.goal || row.expected || ''}
            actual={row.actual}
            status={row.status || getStatus(row.category, row.actual)}
            color={row.color || getCategoryColor(row.category)}
          />
        ))}
      </View>

      <Text style={styles.tableCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splitTableSection: {
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  splitTableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  ruleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0052FF',
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
  },
  tableRowWarning: {
    backgroundColor: 'rgba(254, 226, 226, 0.3)',
  },
  categoryCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  goalCell: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  actualCell: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'center',
  },
  actualBold: {
    fontWeight: '700',
  },
  actualDanger: {
    color: '#EF4444',
  },
  statusCell: {
    width: 32,
    alignItems: 'center',
    flexShrink: 0,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCaption: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
