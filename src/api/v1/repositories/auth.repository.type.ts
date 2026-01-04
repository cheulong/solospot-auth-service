export interface AuthRepository {
  create: (authData: any) => Promise<any>;
  getByEmail: (email: string) => Promise<any>;
  saveRefreshToken: (authId: string, refreshToken: string, expiresAt: Date) => Promise<any>;
  getRefreshTokenByToken: (refreshToken: string) => Promise<any>;
  deleteRefreshToken: (refreshToken: string) => Promise<void>;
  // getAll: () => Promise<any[]>;
  // getById: (id: string) => Promise<any>;
  // updateById: (id: string, authData: any) => Promise<any>;
  // deleteById: (id: string) => Promise<any>;
  // deleteAll: () => Promise<any[]>;
}
