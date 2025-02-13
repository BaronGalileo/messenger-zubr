import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeAuth, setAuth } from "../../store/authSlice"
import {  useFormContext } from "react-hook-form";
import axios from "axios";
import store, { AppDispatch, RootState } from "../../store";
import { AuthState } from "../../types/auth";
import { refreshTokenIfNeeded } from "../../services/refreshToken";
import { api } from "../../services/api";






export const LoginForm = () => {

    const [message, setMessage] = useState("");

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
            console.log("RES-DATA", res.data)
            console.log("DATA", data)
            if(res.data.refresh && res.data.access){
                const accountAdd: AuthState = {
                    username: data.username,
                    refresh: res.data.refresh,
                    access: res.data.access,
                    isAuth: true,
                    confermAut : {headers: {"Authorization" : `Bearer ${res.data.access}`}},
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



    const show = () => {
        console.log("SHOW", isAuth )
        // const token = isAuth.access;
        // const socket = new WebSocket(`ws://localhost:8000/ws/messages/3/?token=${token}`);

        // socket.onopen = () => {
        //     console.log("WebSocket connection opened");
        // };
        // // socket.onopen = () => {
        // //     console.log("OPEN", isAuth.access);
        // //     socket.send(JSON.stringify({
        // //         "token": isAuth.access
        // //     }));
        
        // socket.onerror = (error) => {
        //     console.log("WebSocket Error: ", error);
        // };
        
        // socket.onclose = (event) => {
        //     console.log("WebSocket Closed: ", event);
        // };
        // const my_array = [2,4,7,3,5,9,11,0]
        // let max_max = my_array[0] > my_array[1] ? my_array[0] : my_array[1]
        // let max_2 = max_max === my_array[1] ? my_array[0] : my_array[1]
        // for(let i = 2; i <my_array.length; i++) {
        //     if(my_array[i] > max_2 && my_array[i] < max_max){
        //         max_2 = my_array[i]
        //     }
        //     else if(my_array[i] > max_2 && my_array[i] > max_max){
        //         max_2 = max_max
        //         max_max = my_array[i]
        //     }

        // }
        // console.log("max_max", max_max)
        // console.log("max_2", max_2)

        // interface Imap {
        //     id: number,
        //     name: string,
        //     age?: number
            
        // }

        // const my_map:Imap[] = [
        //     {id: 1, name: "Иванов"},
        //     {id: 2, name: "Петров"},
        //     {id: 3, name: "Сидоров"},
        //     {id: 4, name: "Сергеев"},
        //     {id: 5, name: "Васильев"},
        // ]

        // let new_map = my_map.map(i => {
        //     let rondom_age = Math.floor(Math.random() * (80 - 20 + 1)) + 20;
        //     i.age = rondom_age;
        //     return i;
        // });
        // console.log(new_map)



























        // for(let i = 0; i < my_array.length; i++){
        //     let j = my_array[i+1] ? my_array[i+1] : 0;
        //     console.log("i", i)
        //     console.log("j", j)
        //     console.log("my_array[i]", my_array[i])
        // }
    }

    const del = () => {
        dispatch(removeAuth()) 
    }

    const post_request = () => {
        api.get('/api/accounts/account/').then(res => console.log(res.data))

    
    }


    // if(isAuth.isAuth) return <Navigate to="/"/>
    

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
            <button onClick={show} >Показать</button>
            <button onClick={del} >Удалить</button>
            <button onClick={post_request} >ЗАПРОСИТЬ</button>
            </div>
        </div>
        </>
    )
}
