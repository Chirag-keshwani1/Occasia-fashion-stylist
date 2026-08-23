import { apiClient as api } from '../api/axios';

export interface Address {
  _id?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export const userService = {
  getProfile: async () => {
    return api.get('/users/me');
  },
  getAddresses: async () => {
    return api.get<{ data: { addresses: Address[] } }>('/users/me/addresses');
  },
  addAddress: async (address: Address) => {
    return api.post<{ data: { address: Address } }>('/users/me/addresses', address);
  },
  updateAddress: async (addressId: string, address: Partial<Address>) => {
    return api.put<{ data: { address: Address } }>(`/users/me/addresses/${addressId}`, address);
  },
  deleteAddress: async (addressId: string) => {
    return api.delete(`/users/me/addresses/${addressId}`);
  },
  setDefaultAddress: async (addressId: string) => {
    return api.patch(`/users/me/addresses/${addressId}/default`);
  }
};
