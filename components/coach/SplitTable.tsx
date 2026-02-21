import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SplitTableRowProps = {
  category: string;
  expected: string;
  actual: string;
  isHeader?: boolean;
};

function SplitTableRow({ category, expected, actual, isHeader }: SplitTableRowProps) {
  return (
    <View style={[styles.tableRow, isHeader && styles.tableHeaderRow]}>
      <Text style={[styles.tableCell, styles.tableCellLeft, isHeader && styles.tableHeaderText]}>
        {category}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellCenter, isHeader && styles.tableHeaderText]}>
        {expected}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellRight, isHeader && styles.tableHeaderText]}>
        {actual}
      </Text>
    </View>
  );
}

type SplitTableProps = {
  data: Array<{ category: string; expected: string; actual: string }>;
  caption: string;
};

export default function SplitTable({ data, caption }: SplitTableProps) {
  return (
    <View style={styles.splitTableSection}>
      <Text style={styles.splitTableTitle}>Spending Split</Text>
      
      <View style={styles.table}>
        <SplitTableRow
          category="Category"
          expected="Expected"
          actual="Your Actual"
          isHeader
        />
        {data.map((row, index) => (
          <SplitTableRow
            key={index}
            category={row.category}
            expected={row.expected}
            actual={row.actual}
          />
        ))}
      </View>

      <Text style={styles.tableCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splitTableSection: {
    paddingVertical: 16,
  },
  splitTableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderRow: {
    backgroundColor: '#F3F4F6',
  },
  tableCell: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  tableCellLeft: {
    flex: 2,
    fontWeight: '500',
  },
  tableCellCenter: {
    flex: 1.5,
    textAlign: 'center',
  },
  tableCellRight: {
    flex: 1.5,
    textAlign: 'center',
    fontWeight: '600',
    color: '#111827',
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#6B7280',
    fontSize: 12,
  },
  tableCaption: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    lineHeight: 20,
  },
});
