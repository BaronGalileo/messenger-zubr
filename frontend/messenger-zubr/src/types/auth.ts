export interface AuthState {
    username: string | null;
    auth_token: string | null;
    isAuth: boolean;
    confermAut: {
      headers: {
        Authorization: string;
      };
    } | null;
  }
  
  export interface AuthPayload {
    username: string;
    auth_token: string;
    confermAut: {
      headers: {
        Authorization: string;
      };
    };
  }