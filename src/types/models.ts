// Backend model interfaces

export interface Address {
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  zip: string;
}

export interface Contact {
  phone: string;
  email: string;
}

export interface Doctor {
  _id: string;
  credentials: {
    username: string;
    password: string;
  };
  name: string;
  address: Address;
  contact: Contact;
  speciality: string;
  patients: string[]; // Patient IDs
  health_structure_id: string;
}

export interface HealthStructure {
  _id: string;
  name: string;
  address: Address;
  contact: Contact;
  doctors: string[]; // Doctor IDs
}

export interface Condition {
  _id: string;
  name: string;
}

export interface Patient {
  _id: string;
  name: string;
  address: Address;
  contact: Contact;
  doctor_id: string;
  conditions: string[]; // Condition IDs
}

export interface QuestionCategory {
  _id: string;
  name: string;
  code: string;
  files: boolean;
}

export interface Question {
  _id: string;
  description: string;
  category_id: string;
  answer: string;
  guides: string;
  filePath?: string;
}

export interface Status {
  _id: string;
  code: 'PENDING' | 'INPROGRESS' | 'COMPLETED';
  name: string;
}

export interface TestResults {
  scorePercent: number;
  notes?: string;
  questionCategories?: string[]; // Question category IDs
}

export interface Test {
  _id: string;
  testName: string;
  questions: string[]; // Question IDs
  doctor_id: string;
  patient_id: string;
  name: string;
  status: string; // Status ID
  startDate: Date;
  endDate: Date;
  results?: TestResults;
}

export interface TestDoctorPatient {
  _id: string;
  test_id: string;
  doctor_id: string;
  patient_id: string;
  name: string;
  status: string; // Status ID
  startDate: Date;
  endDate: Date;
  results?: TestResults;
}
