import React,{useCallback,useEffect,useState} from "react";
import {ActivityIndicator,FlatList,Pressable,StyleSheet,Text,View} from "react-native";
import {ArrowLeft,Bell,CheckCheck,RefreshCw} from "lucide-react-native";
import {endpoints,errMsg,listOf} from "../api";
import {OMIQORA} from "../theme";
const C=OMIQORA.colors;
export function NotificationsScreen({onBack}:{onBack:()=>void}){
 const [items,setItems]=useState<any[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{setBusy(true);setError("");try{setItems(listOf(await endpoints.notifications()))}catch(e){setError(errMsg(e))}finally{setBusy(false)}},[]);
 useEffect(()=>{load()},[load]);
 const readAll=async()=>{try{await endpoints.readAll();await load()}catch(e){setError(errMsg(e))}};
 return <View style={s.page}><View style={s.header}><Pressable onPress={onBack} style={s.icon}><ArrowLeft size={20} color={C.goldLight}/></Pressable><View style={{flex:1}}><Text style={s.eye}>YOUR OMIQORA</Text><Text style={s.title}>Notifications</Text></View><Pressable onPress={readAll} style={s.icon}><CheckCheck size={19} color={C.gold}/></Pressable></View>
 {busy?<View style={s.center}><ActivityIndicator color={C.gold}/></View>:error?<View style={s.center}><Text style={s.error}>{error}</Text><Pressable onPress={load} style={s.retry}><RefreshCw size={16} color={C.midnight}/><Text style={s.retryText}>Retry</Text></Pressable></View>:<FlatList data={items} keyExtractor={(x,i)=>String(x?._id??x?.id??i)} contentContainerStyle={s.list} ListEmptyComponent={<View style={s.center}><Bell size={28} color={C.gold}/><Text style={s.empty}>No notifications yet.</Text></View>} renderItem={({item})=><View style={s.card}><Text style={s.cardTitle}>{item?.title??item?.type??"OMIQORA update"}</Text><Text style={s.copy}>{item?.message??item?.content??item?.body??""}</Text>{item?.createdAt?<Text style={s.date}>{new Date(item.createdAt).toLocaleString()}</Text>:null}</View>}/>}
 </View>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.midnight},header:{padding:18,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:C.border},icon:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,alignItems:"center",justifyContent:"center"},eye:{color:C.gold,fontSize:8,fontWeight:"900",letterSpacing:1.5},title:{color:C.white,fontSize:21,fontWeight:"900",marginTop:3},list:{padding:16,gap:10,flexGrow:1},card:{borderRadius:18,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,padding:15},cardTitle:{color:C.white,fontSize:13,fontWeight:"900"},copy:{color:C.muted,fontSize:11,lineHeight:18,marginTop:6},date:{color:C.mutedSoft,fontSize:8,marginTop:9},center:{flex:1,minHeight:260,alignItems:"center",justifyContent:"center",padding:28},empty:{color:C.muted,fontSize:12,marginTop:12},error:{color:C.danger,textAlign:"center",fontSize:12,lineHeight:19},retry:{marginTop:14,height:43,borderRadius:14,backgroundColor:C.gold,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:7},retryText:{color:C.midnight,fontWeight:"900",fontSize:11}});
