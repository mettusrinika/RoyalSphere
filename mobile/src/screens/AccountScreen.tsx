import React,{useEffect,useState} from "react";
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {Bell,Bookmark,BriefcaseBusiness,CreditCard,LogOut,MessageCircle,Save,ShieldCheck,WalletCards} from "lucide-react-native";
import {endpoints,errMsg} from "../api";
import {useSession} from "../stores/session";
import {OMIQORA} from "../theme";

const C=OMIQORA.colors;

type Props={
 onNotifications:()=>void;
 onMessages:()=>void;
 onVendor:()=>void;
 onSaved:()=>void;
 onPayments:()=>void;
 onAdmin:()=>void;
};

export function AccountScreen({
 onNotifications,
 onMessages,
 onVendor,
 onSaved,
 onPayments,
 onAdmin,
}:Props){
 const {user,logout,refreshUser}=useSession();
 const [firstName,setFirstName]=useState(user?.firstName??"");
 const [lastName,setLastName]=useState(user?.lastName??"");
 const [phone,setPhone]=useState(user?.phone??"");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");

 const role=String(user?.role??"customer").toLowerCase();
 const isAdmin=role==="admin";
 const isVendor=role==="vendor"||Boolean(user?.isVendorApproved);

 useEffect(()=>{
  setFirstName(user?.firstName??"");
  setLastName(user?.lastName??"");
  setPhone(user?.phone??"");
 },[user]);

 const save=async()=>{
  setBusy(true);
  setMessage("");
  try{
   await endpoints.updateProfile({
    firstName:firstName.trim(),
    lastName:lastName.trim(),
    phone:phone.trim(),
   });
   await refreshUser();
   setMessage("Profile updated.");
  }catch(e){
   setMessage(errMsg(e));
  }finally{
   setBusy(false);
  }
 };

 const displayRole=isAdmin?"ADMIN":isVendor?"VENDOR":"CUSTOMER";

 return (
  <ScrollView style={s.page} contentContainerStyle={s.content}>
   <Text style={s.eye}>YOUR SPACE</Text>
   <Text style={s.title}>Account</Text>

   <View style={s.profile}>
    <View style={s.avatar}>
     <Text style={s.avatarText}>
      {(user?.firstName?.[0]??user?.email?.[0]??"O").toUpperCase()}
     </Text>
    </View>

    <View style={{flex:1}}>
     <Text style={s.name}>
      {[user?.firstName,user?.lastName].filter(Boolean).join(" ")||
       (isAdmin?"OMIQORA Admin":isVendor?"OMIQORA Vendor":"OMIQORA Customer")}
     </Text>
     <Text style={s.email}>{user?.email}</Text>
     <Text style={s.role}>{displayRole}</Text>
    </View>
   </View>

   <View style={s.actions}>
    {isAdmin?(
     <>
      <Action icon={<ShieldCheck size={18} color={C.gold}/>} label="Admin operations" onPress={onAdmin}/>
      <Action icon={<CreditCard size={18} color={C.gold}/>} label="Platform payments" onPress={onPayments}/>
      <Action icon={<Bell size={18} color={C.gold}/>} label="Notifications" onPress={onNotifications}/>
     </>
    ):isVendor?(
     <>
      <Action icon={<BriefcaseBusiness size={18} color={C.gold}/>} label="Vendor workspace" onPress={onVendor}/>
      <Action icon={<WalletCards size={18} color={C.gold}/>} label="Earnings and payouts" onPress={onPayments}/>
      <Action icon={<MessageCircle size={18} color={C.gold}/>} label="Customer messages" onPress={onMessages}/>
      <Action icon={<Bell size={18} color={C.gold}/>} label="Notifications" onPress={onNotifications}/>
     </>
    ):(
     <>
      <Action icon={<WalletCards size={18} color={C.gold}/>} label="Wallet and payments" onPress={onPayments}/>
      <Action icon={<Bookmark size={18} color={C.gold}/>} label="Saved services" onPress={onSaved}/>
      <Action icon={<MessageCircle size={18} color={C.gold}/>} label="Messages" onPress={onMessages}/>
      <Action icon={<Bell size={18} color={C.gold}/>} label="Notifications" onPress={onNotifications}/>
      <Action icon={<BriefcaseBusiness size={18} color={C.gold}/>} label="Become a vendor" onPress={onVendor}/>
     </>
    )}
   </View>

   <Text style={s.section}>PROFILE DETAILS</Text>

   <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={C.mutedSoft}/>
   <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={C.mutedSoft}/>
   <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={C.mutedSoft} keyboardType="phone-pad"/>

   {message?<Text style={[s.message,message==="Profile updated."&&s.success]}>{message}</Text>:null}

   <Pressable style={s.save} onPress={save} disabled={busy}>
    {busy?<ActivityIndicator color={C.midnight}/>:<><Save size={18} color={C.midnight}/><Text style={s.saveText}>Save profile</Text></>}
   </Pressable>

   <Pressable style={s.logout} onPress={logout}>
    <LogOut size={18} color={C.danger}/>
    <Text style={s.logoutText}>Sign out</Text>
   </Pressable>
  </ScrollView>
 );
}

function Action({icon,label,onPress}:{icon:React.ReactNode;label:string;onPress:()=>void}){
 return <Pressable style={s.action} onPress={onPress}>{icon}<Text style={s.actionText}>{label}</Text></Pressable>;
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.midnight},
 content:{padding:19,paddingBottom:35},
 eye:{color:C.gold,fontSize:8,fontWeight:"900",letterSpacing:1.7},
 title:{color:C.white,fontSize:25,fontWeight:"900",marginTop:5},
 profile:{marginTop:20,borderRadius:23,borderWidth:1,borderColor:C.borderStrong,backgroundColor:C.royalNavy,padding:17,flexDirection:"row",alignItems:"center",gap:14},
 avatar:{width:57,height:57,borderRadius:29,backgroundColor:C.gold,alignItems:"center",justifyContent:"center"},
 avatarText:{color:C.midnight,fontSize:22,fontWeight:"900"},
 name:{color:C.white,fontSize:16,fontWeight:"900"},
 email:{color:C.muted,fontSize:10,marginTop:5},
 role:{color:C.goldLight,fontSize:8,fontWeight:"900",letterSpacing:1.2,marginTop:6},
 actions:{marginTop:15,gap:8},
 action:{minHeight:52,borderRadius:16,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,paddingHorizontal:15,flexDirection:"row",alignItems:"center",gap:10},
 actionText:{flex:1,color:C.text,fontSize:12,fontWeight:"800"},
 section:{color:C.gold,fontSize:8,fontWeight:"900",letterSpacing:1.5,marginTop:24,marginBottom:10},
 input:{height:52,borderRadius:16,borderWidth:1,borderColor:C.border,backgroundColor:C.input,color:C.white,paddingHorizontal:14,fontSize:12,marginBottom:9},
 message:{color:C.danger,fontSize:10,lineHeight:16,marginBottom:8},
 success:{color:C.goldLight},
 save:{height:52,borderRadius:16,backgroundColor:C.gold,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
 saveText:{color:C.midnight,fontSize:12,fontWeight:"900"},
 logout:{height:52,borderRadius:16,borderWidth:1,borderColor:C.dangerBorder,backgroundColor:C.royalNavy,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,marginTop:11},
 logoutText:{color:C.danger,fontSize:12,fontWeight:"900"},
});