export interface IVendorCreate {
  name?: string;
  companyName?: string;
  email: string;
  phone: string;
  passwordHash?: string;
  commoditiId?: string | null;
  additionalPhone?: string;
  address?: string;
  country?: string;
  city?: string;
  designation?: string;
  website?: string;
  isVerified?: boolean;
  isActive?: boolean;
}
