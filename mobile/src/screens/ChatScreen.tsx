import React,{useCallback,useEffect,useState} from "react";
import {ActivityIndicator,FlatList,KeyboardAvoidingView,Platform,Pressable,StyleSheet,Text,TextInput,View} from "react-native";
import {ArrowLeft,Send,Wifi,WifiOff} from "lucide-react-native";
import {endpoints,errMsg,listOf} from "../api";
import {getSocket} from "../socket";
import {useSession} from "../stores/session";
import {OMIQORA} from "../theme";
const C=OMIQORA.colors;

export function ChatScreen({conversationId,onBack}:{conversationId:string;onBack:()=>void}){
 const user=useSession(x=>x.user);
 const [items,setItems]=useState<any[]>([]),[text,setText]=useState(""),[busy,setBusy]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState(""),[connected,setConnected]=useState(false);
 const load=useCallback(async()=>{try{setError("");setItems(listOf(await endpoints.conversation(conversationId)))}catch(e){setError(errMsg(e))}finally{setBusy(false)}},[conversationId]);

 useEffect(()=>{load()},[load]);
 useEffect(()=>{
   let active=true;let current:any=null;
   const start=async()=>{
     current=await getSocket();
     if(!active||!current)return;
     const onConnect=()=>{setConnected(true);current.emit("join_conversation",{conversationId})};
     const onDisconnect=()=>setConnected(false);
     const onMessage=(message:any)=>setItems(previous=>{
       const id=String(message?._id??message?.id??"");
       if(id&&previous.some(item=>String(item?._id??item?.id??"")===id))return previous;
       return [...previous,message];
     });
     current.on("connect",onConnect);current.on("disconnect",onDisconnect);current.on("new_message",onMessage);
     if(current.connected)onConnect();
   };
   start();
   return()=>{active=false;if(current){current.emit("leave_conversation",{conversationId});current.off("connect");current.off("disconnect");current.off("new_message")}};
 },[conversationId]);

 const send=async()=>{const value=text.trim();if(!value||sending)return;setSending(true);setText("");try{
   const socket=await getSocket();
   if(socket?.connected){
     await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error("Message timed out")),12000);socket.emit("send_message",{conversationId,content:value,type:"text"},(ack:any)=>{clearTimeout(timeout);if(ack?.success)resolve();else reject(new Error(ack?.message??"Unable to send message"))})});
   }else{await endpoints.sendMessage(conversationId,value);await load()}
 }catch(e){setText(value);setError(errMsg(e))}finally{setSending(false)}};

 return <KeyboardAvoidingView style={s.page} behavior={Platform.OS==="ios"?"padding":undefined}><View style={s.header}><Pressable onPress={onBack} style={s.icon}><ArrowLeft size={20} color={C.goldLight}/></Pressable><View style={{flex:1}}><Text style={s.eye}>OMIQORA CHAT</Text><Text style={s.title}>Conversation</Text></View><View style={s.live}>{connected?<Wifi size={14} color={C.goldLight}/>:<WifiOff size={14} color={C.muted}/>}<Text style={s.liveText}>{connected?"LIVE":"FALLBACK"}</Text></View></View>
 {error?<Text style={s.error}>{error}</Text>:null}{busy?<View style={s.center}><ActivityIndicator color={C.gold}/></View>:<FlatList data={items} keyExtractor={(x,i)=>String(x?._id??x?.id??i)} contentContainerStyle={s.list} renderItem={({item})=>{const sender=String(item?.senderId?._id??item?.senderId??item?.sender?._id??item?.sender??"");const mine=sender===String(user?._id??"");return <View style={[s.bubble,mine?s.mine:s.theirs]}><Text style={s.message}>{item?.content??item?.message??""}</Text></View>}}/>}
 <View style={s.composer}><TextInput value={text} onChangeText={setText} placeholder="Write a message..." placeholderTextColor={C.mutedSoft} style={s.input} multiline/><Pressable onPress={send} style={s.send}>{sending?<ActivityIndicator color={C.midnight}/>:<Send size={18} color={C.midnight}/>}</Pressable></View></KeyboardAvoidingView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.midnight},header:{padding:18,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:C.border},icon:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,alignItems:"center",justifyContent:"center"},eye:{color:C.gold,fontSize:8,fontWeight:"900",letterSpacing:1.5},title:{color:C.white,fontSize:20,fontWeight:"900",marginTop:3},live:{flexDirection:"row",alignItems:"center",gap:5},liveText:{color:C.muted,fontSize:8,fontWeight:"900"},error:{color:C.danger,fontSize:10,textAlign:"center",padding:8},center:{flex:1,alignItems:"center",justifyContent:"center"},list:{padding:15,gap:8},bubble:{maxWidth:"82%",padding:12,borderRadius:17,borderWidth:1},mine:{alignSelf:"flex-end",backgroundColor:C.elevatedNavy,borderColor:C.borderStrong},theirs:{alignSelf:"flex-start",backgroundColor:C.royalNavy,borderColor:C.border},message:{color:C.text,fontSize:12,lineHeight:18},composer:{padding:11,flexDirection:"row",alignItems:"flex-end",gap:8,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.royalNavy},input:{flex:1,minHeight:47,maxHeight:105,borderRadius:16,borderWidth:1,borderColor:C.border,backgroundColor:C.input,color:C.white,paddingHorizontal:14,paddingVertical:11,fontSize:12},send:{width:47,height:47,borderRadius:15,backgroundColor:C.gold,alignItems:"center",justifyContent:"center"}});


