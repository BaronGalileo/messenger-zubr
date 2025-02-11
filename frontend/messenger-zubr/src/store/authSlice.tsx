import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import { AuthState, AuthPayload } from "../types/auth"


const initialState:AuthState = {
    username: null,
    auth_token:  null,
    isAuth: false,
    confermAut: null,
}



const authSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setAuth(state, action: PayloadAction<AuthPayload>) {
            state.username = action.payload.username;
            state.auth_token = action.payload.auth_token;
            state.isAuth = true;
            state.confermAut = action.payload.confermAut;
        },
        removeAuth(state) {
            state.username = null;
            state.auth_token = null;
            state.isAuth = false;
            state.confermAut = null;
        }
    },

});

export const {setAuth, removeAuth} = authSlice.actions;

export default authSlice.reducer;