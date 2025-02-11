import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import { AuthState } from "../types/auth"


const initialState:AuthState = {
    username: null,
    refresh: null,
    access:  null,
    isAuth: false,
    confermAut: null,
}



const authSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setAuth(state, action: PayloadAction<AuthState>) {
            state.username = action.payload.username;
            state.refresh = action.payload.refresh;
            state.access = action.payload.access;
            state.isAuth = true;
            state.confermAut = action.payload.confermAut;
        },
        removeAuth(state) {
            state.username = null;
            state.refresh = null;
            state.access = null;
            state.isAuth = false;
            state.confermAut = null;
        }
    },

});

export const {setAuth, removeAuth} = authSlice.actions;

export default authSlice.reducer;