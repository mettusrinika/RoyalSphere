import React,{useEffect} from "react";
import {Platform} from "react-native";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {AuthScreen} from "./src/screens/AuthScreen";
import {MainShell} from "./src/screens/MainShell";
import {useSession} from "./src/stores/session";
import {endpoints} from "./src/api";

Notifications.setNotificationHandler({
  handleNotification:async()=>({
    shouldShowBanner:true,
    shouldShowList:true,
    shouldPlaySound:true,
    shouldSetBadge:false,
  }),
});

async function registerForPushNotifications(){
  if(!Device.isDevice)return;

  if(Platform.OS==="android"){
    await Notifications.setNotificationChannelAsync("default",{
      name:"OMIQORA",
      importance:Notifications.AndroidImportance.MAX,
      vibrationPattern:[0,250,250,250],
    });
  }

  const existing=await Notifications.getPermissionsAsync();
  let status=existing.status;

  if(status!=="granted"){
    const requested=await Notifications.requestPermissionsAsync();
    status=requested.status;
  }

  if(status!=="granted")return;

  const projectId=
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if(!projectId)return;

  const token=
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  if(!token.data)return;

  await endpoints.registerPushToken(token.data);
}

function Content(){
  const{user,hydrated,hydrate}=useSession();

  useEffect(()=>{
    hydrate();
  },[hydrate]);

  useEffect(()=>{
    if(!hydrated||!user)return;

    registerForPushNotifications().catch(error=>{
      console.warn(
        "Push registration failed",
        error,
      );
    });
  },[hydrated,user]);

  if(!hydrated)return null;

  return user?<MainShell/>:<AuthScreen/>;
}

export default function App(){
  return(
    <SafeAreaProvider>
      <StatusBar style="light"/>
      <Content/>
    </SafeAreaProvider>
  );
}
