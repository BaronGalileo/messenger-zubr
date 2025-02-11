export interface AuthState {
    username: string | null;
    access: string | null;
    isAuth: boolean;
    refresh: string | null;
    confermAut: {
      headers: {
        Authorization: string;
      };
    } | null;
  }
  