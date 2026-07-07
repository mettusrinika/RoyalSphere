import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { ACCESS_KEY, REFRESH_KEY, api, unwrap } from "../api";

type User = {_id?:string;firstName?:string;lastName?:string;email:string;role?:string;isVendorApproved?:boolean;[key:string]:any};
type State = {
  user:User|null; hydrated:boolean; loading:boolean;
  hydrate:()=>Promise<void>; login:(email:string,password:string)=>Promise<void>;
  register:(x:any)=>Promise<any>; refreshUser:()=>Promise<void>; logout:()=>Promise<void>;
};

const USER_KEY = "omiqora_user";

export const useSession = create<State>((set) => ({
  user:null, hydrated:false, loading:false,

  hydrate:async () => {
    try {
      const access = await SecureStore.getItemAsync(ACCESS_KEY);
      const cached = await SecureStore.getItemAsync(USER_KEY);
      // Cached user is retained in SecureStore but authenticated UI waits for token validation.
      if (!access) { set({user:null,hydrated:true}); return; }
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
      try {
        const response = await api.get("/auth/me");
        const data:any = unwrap(response);
        const user = data?.user ?? data;
        if (user?.email) {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
          set({user,hydrated:true});
          return;
        }
      } catch {}
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) throw new Error("No refresh token");
      const response = await api.post("/auth/refresh", {refreshToken});
      const tokens:any = unwrap(response);
      await SecureStore.setItemAsync(ACCESS_KEY,tokens.accessToken);
      if (tokens.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY,tokens.refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;
      const me:any = unwrap(await api.get("/auth/me"));
      const user = me?.user ?? me;
      await SecureStore.setItemAsync(USER_KEY,JSON.stringify(user));
      set({user,hydrated:true});
    } catch {
      await SecureStore.deleteItemAsync(ACCESS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      delete api.defaults.headers.common.Authorization;
      set({user:null,hydrated:true});
    }
  },

  login:async (email,password) => {
    set({loading:true});
    try {
      const data:any = unwrap(await api.post("/auth/login",{email:email.trim().toLowerCase(),password}));
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_KEY,data.accessToken),
        SecureStore.setItemAsync(REFRESH_KEY,data.refreshToken),
        SecureStore.setItemAsync(USER_KEY,JSON.stringify(data.user)),
      ]);
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      set({user:data.user});
    } finally { set({loading:false}); }
  },

  register:async x => {
    set({loading:true});
    try {
      return unwrap(await api.post("/auth/register",{
        firstName:x.firstName.trim(),lastName:x.lastName.trim(),
        email:x.email.trim().toLowerCase(),password:x.password,
        ...(x.phone?.trim()?{phone:x.phone.trim()}:{}),
      }));
    } finally { set({loading:false}); }
  },

  refreshUser:async () => {
    const data:any = unwrap(await api.get("/auth/me"));
    const user = data?.user ?? data;
    await SecureStore.setItemAsync(USER_KEY,JSON.stringify(user));
    set({user});
  },

  logout:async () => {
    try { await api.post("/auth/logout"); } catch {}
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    delete api.defaults.headers.common.Authorization;
    set({user:null});
  },
}));
