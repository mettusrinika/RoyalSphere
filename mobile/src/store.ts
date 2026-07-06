import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
type User={_id?:string;firstName?:string;lastName?:string;email?:string;role?:string;[k:string]:any};
type State={user:User|null;ready:boolean;setSession:(a:any)=>Promise<void>;restore:()=>Promise<void>;logout:()=>Promise<void>};
export const useSession=create<State>((set)=>({
 user:null,ready:false,
 setSession:async(a)=>{await SecureStore.setItemAsync('accessToken',a.accessToken);await SecureStore.setItemAsync('refreshToken',a.refreshToken);await SecureStore.setItemAsync('user',JSON.stringify(a.user));set({user:a.user,ready:true});},
 restore:async()=>{try{const u=await SecureStore.getItemAsync('user');set({user:u?JSON.parse(u):null,ready:true});}catch{set({user:null,ready:true});}},
 logout:async()=>{await SecureStore.deleteItemAsync('accessToken');await SecureStore.deleteItemAsync('refreshToken');await SecureStore.deleteItemAsync('user');set({user:null,ready:true});}
}));
