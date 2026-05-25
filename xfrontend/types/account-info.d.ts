// region Donor

declare interface DonorInfo {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: USER_ROLE;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: {id:string} | null;
}

// region System admin
declare interface SystemAdminInfo {
  id?: string;
  email?: string;
  first_name?: string;
  profile_picture?: any | null;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: USER_ROLE;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: {id:string} | null;
}

// region Social worker
declare interface SocialWorkerInfoSerializer {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: USER_ROLE;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: SocialWorkerProfile | null;
}


interface CommonInfo{
    national_id_number: string;
    front_national_id_image: any;
    back_national_id_image: any;
    created_at:string;
    updated_at:string;
}

declare interface SocialWorkerProfile extends CommonInfo{
    id: string;
    organization: string;
    region_assigned: boolean;
}

// region Hospital admin

declare interface HospitalAdminInfo{
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: USER_ROLE;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: HospitalAdminProfile | null;
  hospital?: sring | null;
}

declare interface HospitalAdminProfile extends CommonInfo{
    id: string;

}

// region Receptionist

declare interface ReceptionistInfo {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: USER_ROLE;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: ReceptionistProfile | null;
  hospital?: string | null;
}

declare interface ReceptionistProfile extends CommonInfo{
    id: string;
}