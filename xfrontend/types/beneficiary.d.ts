export interface Beneficiary {
  id: string;
  digital_health_id?: string | null;
  picture?: any | null;
  full_name: string;
  date_of_birth: string;
  gender: string;
  category: string;
  number_of_previous_births?: number | null;
  is_verified: boolean;
  phone: string;
  email?: string | null;
  region: string;
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  national_id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  enrolled_by_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BeneficiaryDocument {
  id?: number;
  beneficiary_id: string;
  document: any;
  description?: string;
  uploaded_at?: string;
}

export interface HealthIssue {
  id?: number;
  beneficiary_id: string;
  social_worker_id?: string | null;
  validated_by_id?: string | null;
  category: string;
  severity: string;
  status: string;
  description: string;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HealthIssueEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  health_issue_id: number;
}