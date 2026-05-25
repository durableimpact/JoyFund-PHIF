declare type USER_ROLE =
  | "SYSTEM_ADMIN"
  | "HOSPITAL_ADMIN"
  | "RECEPTIONIST"
  | "SOCIAL_WORKER"
  | "DONOR";

declare interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: any | null;
  phone_number: string;
  role: USER_ROLE;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  last_login?: string | null;
  is_superuser: boolean;
  created_at?: string;
  updated_at?: string;
}


declare interface SystemAdmin {
  id: string;
  user: User;
}

declare interface HospitalAdmin {
  id: string;
  user: User;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  hospital_id?: string | null;
  is_active: boolean;
  enrolled_by_id: string;
}

declare interface Receptionist {
  id: string;
  user: User;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  enrolled_by_id: string;
  is_active: boolean;
  hospital_id?: string | null;
}

declare interface SocialWorker {
  id: string;
  user: User;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  is_approved: boolean;
  organization: string;
  region_assigned: string;
  enrolled_by_id: string;
}

declare interface Donor {
  id: string;
  user: User;
}



// types for creating account

declare interface DonorRegister {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

declare interface DonorUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}