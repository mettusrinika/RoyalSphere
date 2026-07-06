import React,{useEffect} from "react";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AuthScreen} from "./src/screens/AuthScreen";
import {MainShell} from "./src/screens/MainShell";
import {useSession} from "./src/stores/session";
function Content(){const{user,hydrated,hydrate}=useSession();useEffect(()=>{hydrate()},[hydrate]);if(!hydrated)return null;return user?<MainShell/>:<AuthScreen/>}
export default function App(){return <SafeAreaProvider><StatusBar style="light"/><Content/></SafeAreaProvider>}
