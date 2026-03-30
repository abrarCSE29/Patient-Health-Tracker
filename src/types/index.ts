export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isCaregiver: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string; // The user who manages this profile
  name: string;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
  relationship: string; // "Self", "Mother", "Father", "Child", etc.
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  patientProfileId: string;
  name: string;
  specialty?: string;
  clinicName?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  patientProfileId: string;
  medicineId?: string; // FK to master catalog
  doctorId: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  notes?: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  scheduledTime: string;
  status: "pending" | "taken" | "missed";
  takenAt?: string;
  createdAt: string;
}

export interface TestReport {
  id: string;
  patientProfileId: string;
  doctorId?: string;
  testName: string;
  testDate: string;
  imageUrl: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorVisit {
  id: string;
  patientProfileId: string;
  doctorId: string;
  visitDate: string;
  reason?: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  patientProfileId: string;
  type: "medication" | "visit";
  title: string;
  message: string;
  read: boolean;
  scheduledFor: string;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  patientProfileId: string;
  medicationReminders: boolean;
  visitReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatedAt: string;
}
