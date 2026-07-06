import React,{useState} from "react";
import {ActivityIndicator,FlatList,KeyboardAvoidingView,Platform,Pressable,StyleSheet,Text,TextInput,View} from "react-native";
import {Bot,Send,Sparkles} from "lucide-react-native";
import {endpoints,errMsg,unwrap} from "../api";
import {OMIQORA} from "../theme";
const C=OMIQORA.colors;
type Item={id:string;role:"user"|"omi";text:string};
export function OmiScreen(){
 const [items,setItems]=useState<Item[]>([{id:"welcome",role:"omi",text:"I am OMI. Tell me what you need and I will help you navigate the OMIQORA ecosystem."}]);
 const [text,setText]=useState(""); const [busy,setBusy]=useState(false);
 const send=async()=>{const message=text.trim();if(!message||busy)return;setText("");setItems(v=>[...v,{id:`u-${Date.now()}`,role:"user",text:message}]);setBusy(true);
 try{const d:any=unwrap(await endpoints.aiSupport(message));const answer=d?.response??d?.answer??d?.message??d?.content??"OMI received your request.";setItems(v=>[...v,{id:`o-${Date.now()}`,role:"omi",text:String(answer)}]);}
 catch(e){setItems(v=>[...v,{id:`e-${Date.now()}`,role:"omi",text:errMsg(e)}]);}finally{setBusy(false)}};
 return <KeyboardAvoidingView style={s.page} behavior={Platform.OS==="ios"?"padding":undefined}>
  <View style={s.header}><View style={s.mark}><Bot size={24} color={C.goldLight}/></View><View><Text style={s.eye}>OMIQORA INTELLIGENCE</Text><Text style={s.title}>OMI</Text></View></View>
  <FlatList data={items} keyExtractor={x=>x.id} contentContainerStyle={s.list} renderItem={({item})=><View style={[s.bubble,item.role==="user"?s.user:s.omi]}><Text style={s.message}>{item.text}</Text></View>} ListFooterComponent={busy?<ActivityIndicator color={C.gold}/>:null}/>
  <View style={s.composer}><TextInput value={text} onChangeText={setText} placeholder="Ask OMI anything..." placeholderTextColor={C.mutedSoft} style={s.input} multiline onSubmitEditing={send}/><Pressable style={s.send} onPress={send}>{busy?<Sparkles size={18} color={C.midnight}/>:<Send size={18} color={C.midnight}/>}</Pressable></View>
 </KeyboardAvoidingView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.midnight},header:{padding:19,flexDirection:"row",alignItems:"center",gap:12,borderBottomWidth:1,borderBottomColor:C.border},mark:{width:48,height:48,borderRadius:18,backgroundColor:C.royalNavy,borderWidth:1,borderColor:C.borderStrong,alignItems:"center",justifyContent:"center"},eye:{color:C.gold,fontSize:8,fontWeight:"900",letterSpacing:1.5},title:{color:C.white,fontSize:23,fontWeight:"900",marginTop:3},list:{padding:16,gap:10},bubble:{maxWidth:"84%",padding:13,borderRadius:18,borderWidth:1},omi:{alignSelf:"flex-start",backgroundColor:C.royalNavy,borderColor:C.border},user:{alignSelf:"flex-end",backgroundColor:C.elevatedNavy,borderColor:C.borderStrong},message:{color:C.text,fontSize:12,lineHeight:19},composer:{flexDirection:"row",alignItems:"flex-end",gap:9,padding:12,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.royalNavy},input:{flex:1,maxHeight:110,minHeight:48,borderRadius:17,borderWidth:1,borderColor:C.border,backgroundColor:C.input,color:C.white,paddingHorizontal:14,paddingVertical:12,fontSize:12},send:{width:48,height:48,borderRadius:16,backgroundColor:C.gold,alignItems:"center",justifyContent:"center"}});
