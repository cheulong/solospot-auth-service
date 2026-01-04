export interface AuthService {
  createAccount: (userData: any) => Promise<any>;
  getAccountByEmail: (email: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  refreshToken: (refreshToken: string) => Promise<any>;
  deleteRefreshToken: (refreshToken: string) => Promise<void>;
  // getAllPlaces: () => Promise<any[]>;
  // createPlace: (placeData: any) => Promise<any>;
  // getPlaceById: (id: string) => Promise<any>;
  // updatePlaceById: (id: string, placeData: any) => Promise<any>;
  // deletePlaceById: (id: string) => Promise<any>;
  // deleteAllPlaces: () => Promise<any[]>;
}
