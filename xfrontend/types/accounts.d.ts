declare type USER_ROLE =
  | "SYSTEM_ADMIN"
  | "HOSPITAL_ADMIN"
  | "RECEPTIONIST"
  | "SOCIAL_WORKER"
  | "DONOR";

declare enum UserRole {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  HOSPITAL_ADMIN = "HOSPITAL_ADMIN",
  SOCIAL_WORKER = "SOCIAL_WORKER",
  RECEPTIONIST = "RECEPTIONIST",
  DONOR = "DONOR",
}

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
  hospital?: {
    id: string;
    name: string;
  } | null;
  is_active: boolean;
  enrolled_by: {
    user_id:string;
    first_name:string;
    last_name:string;
    profile_id:string;
  };
}

declare interface HospitalAdminList {
  id: string;
  user: User;
  hospital?: {
    id: string;
    name: string;
  } | null;
  is_active: boolean;
  enrolled_by: {
    user_id:string;
    first_name:string;
    last_name:string;
    profile_id:string;
  };
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

// region Donor

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

// region Social Worker

declare interface SocialWorkerRegister {
    email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id_number: string;
  front_national_id_image: File;
  back_national_id_image: File;
  organization: string;
  region_assigned: string;
}



// region Hospital Admin

declare interface HospitalAdminRegister {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id_number: string;
  front_national_id_image: File;
  back_national_id_image: File;
  hospital?: string | null;
}

// region Receptionist
declare interface ReceptionistRegister {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id_number: string;
  front_national_id_image: File;
  back_national_id_image: File;
  hospital?: string | null;
}

// region System Admin

declare interface SystemAdminRegister {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}