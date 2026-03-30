import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { format, addDays, parseISO } from 'date-fns';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  date: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  tableContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  tableColumn: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 5,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ccc',
    padding: 5,
  },
  cell: {
    flex: 1,
    fontSize: 9,
  },
  cellSmall: {
    flex: 0.5,
    fontSize: 9,
  },
  cellMedium: {
    flex: 1.5,
    fontSize: 9,
  },
  followUpSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1 solid #000',
  },
  followUpText: {
    fontSize: 10,
    marginBottom: 5,
  },
  mealLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
});

interface Medication {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  durationDays?: number;
  morningDosage?: string;
  afternoonDosage?: string;
  nightDosage?: string;
  morningMeal?: string;
  afternoonMeal?: string;
  nightMeal?: string;
  doctor?: string;
  status: string;
}

interface MedicationRosterPDFProps {
  medications: Medication[];
  profileName?: string;
}

// Calculate end date for a medication
const calculateEndDate = (med: Medication): string => {
  if (med.endDate) {
    return format(parseISO(med.endDate), 'dd/MM/yyyy');
  }
  if (med.durationDays && med.startDate) {
    const start = parseISO(med.startDate);
    const end = addDays(start, med.durationDays);
    return format(end, 'dd/MM/yyyy');
  }
  return 'CONTINUE';
};

// Calculate days remaining
const calculateDaysRemaining = (med: Medication): string => {
  if (med.durationDays) {
    return med.durationDays.toString();
  }
  return 'CONTINUE';
};

export const MedicationRosterPDF: React.FC<MedicationRosterPDFProps> = ({
  medications,
  profileName,
}) => {
  const today = format(new Date(), 'dd/MM/yyyy');

  // Filter active medications
  const activeMeds = medications.filter((m) => m.status === 'active');

  // Categorize by meal timing
  const morningBeforeMeal = activeMeds.filter(
    (m) => m.morningDosage && m.morningMeal === 'Before Meal'
  );
  const morningAfterMeal = activeMeds.filter(
    (m) => m.morningDosage && m.morningMeal === 'After Meal'
  );
  const nightBeforeMeal = activeMeds.filter(
    (m) => m.nightDosage && m.nightMeal === 'Before Meal'
  );
  const nightAfterMeal = activeMeds.filter(
    (m) => m.nightDosage && m.nightMeal === 'After Meal'
  );

  // Get unique doctors for follow-up
  const doctors = [...new Set(activeMeds.map((m) => m.doctor).filter(Boolean))];

  // Render medication table
  const renderMedicationTable = (
    meds: Medication[],
    label: string,
    mealType: 'morning' | 'night'
  ) => (
    <View style={styles.tableColumn}>
      <Text style={styles.mealLabel}>{label}</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.cellSmall}>SL</Text>
        <Text style={styles.cellMedium}>MED NAME</Text>
        <Text style={styles.cellSmall}>QTY</Text>
        <Text style={styles.cell}>To continue for (days)</Text>
        <Text style={styles.cell}>Until</Text>
      </View>
      {meds.map((med, index) => (
        <View key={med.id} style={styles.tableRow}>
          <Text style={styles.cellSmall}>{index + 1}</Text>
          <Text style={styles.cellMedium}>{med.name}</Text>
          <Text style={styles.cellSmall}>
            {mealType === 'morning' ? med.morningDosage : med.nightDosage}
          </Text>
          <Text style={styles.cell}>{calculateDaysRemaining(med)}</Text>
          <Text style={styles.cell}>{calculateEndDate(med)}</Text>
        </View>
      ))}
      {meds.length === 0 && (
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 5, fontStyle: 'italic' }]}>
            No medications
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>{today}</Text>
          {profileName && <Text>Patient: {profileName}</Text>}
        </View>

        {/* Morning Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MORNING</Text>
          <View style={styles.tableContainer}>
            {renderMedicationTable(morningBeforeMeal, 'BEFORE MEAL', 'morning')}
            {renderMedicationTable(morningAfterMeal, 'AFTER MEAL', 'morning')}
          </View>
        </View>

        {/* Night Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NIGHT</Text>
          <View style={styles.tableContainer}>
            {renderMedicationTable(nightBeforeMeal, 'BEFORE MEAL', 'night')}
            {renderMedicationTable(nightAfterMeal, 'AFTER MEAL', 'night')}
          </View>
        </View>

        {/* Follow-up Section */}
        {doctors.length > 0 && (
          <View style={styles.followUpSection}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 10 }}>
              Follow-up Information
            </Text>
            {doctors.map((doctor, index) => (
              <Text key={index} style={styles.followUpText}>
                Follow up with {doctor}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default MedicationRosterPDF;