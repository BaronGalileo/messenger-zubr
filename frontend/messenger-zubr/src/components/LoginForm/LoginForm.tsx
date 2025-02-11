import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeAuth, setAuth } from "../../store/authSlice"
import {  useFormContext } from "react-hook-form";
import axios from "axios";
import { AppDispatch, RootState } from "../../store";






export const LoginForm = () => {

    const isAuth = useSelector((state: RootState) => state.auth);
    const dispatch: AppDispatch = useDispatch();

    const {
        register,
        handleSubmit,
        reset,
        formState: {isValid}
    } = useFormContext()
    


    const onSubmit = (data:any) => {

        const path = "http://127.0.0.1:8000/api/token/"
        axios.post(path, data).then(res=>{
            console.log("DATA", res.data)
            if(res.data.token){
                const accountAdd = {
                    username: data.username,
                    auth_token: res.data.token,
                    confermAut : {headers: {"Authorization" : `Bearer ${res.data.token}`}},
                    }
                    reset()
                    return dispatch(setAuth(accountAdd))
                    
            }
        })
        .catch(err => {
            if(err.request.status === 401){
                dispatch(removeAuth())
                alert("Вы ошиблись! Проверьте Логин и Пароль");
                reset()
            }
            else if(err.request.status >= 500) {
                dispatch(removeAuth())
                alert("Извините, проблема с сервером, попробуйте зайти позже!");
                reset()
            }
            else {
                dispatch(removeAuth())
                console.log("errrr", err)
            }
        })
    }


    if(isAuth.isAuth) return <Navigate to="/"/>
    

    return (
        <>
        <div className="conteyner_form">
            <div className="form-login">
            <form onSubmit={handleSubmit(onSubmit)}>
                <input
                {...register("username", {
                    required: "Обязательно к заполнению",
                })}   />
                <input {...register("password", {
                    required: "Обязательно к заполнению",
                })}  type="password"/>
                <button disabled={!isValid} className="add-book">Войти</button>
            </form>
            </div>
        </div>
        </>
    )
}
