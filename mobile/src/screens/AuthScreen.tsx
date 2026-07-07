import React,{useState} from "react";
import {
 ActivityIndicator,Alert,KeyboardAvoidingView,Platform,Pressable,ScrollView,
 StyleSheet,Text,TextInput,View,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {Eye,EyeOff,LockKeyhole,Mail,Phone,UserRound} from "lucide-react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {apiError} from "../services/api";
import {useSession} from "../stores/session";
import {OMIQORA} from "../theme";
const C=OMIQORA.colors;

type FieldProps={
 icon:React.ReactNode; placeholder:string; value:string;
 onChangeText:(value:string)=>void; autoCapitalize?:"none"|"sentences"|"words"|"characters";
 keyboardType?:"default"|"email-address"|"phone-pad";
 autoComplete?:"email"|"off"|"tel"|"one-time-code";
 textContentType?:"emailAddress"|"none"|"telephoneNumber"|"oneTimeCode";
};

function AuthField({icon,...props}:FieldProps){
 return <View style={styles.field}>{icon}<TextInput
   style={styles.input} placeholderTextColor={C.mutedSoft}
   blurOnSubmit={false} {...props}
 /></View>;
}

export function AuthScreen(){
 const[registerMode,setRegisterMode]=useState(false);
 const[phoneMode,setPhoneMode]=useState(false);
 const[otpSent,setOtpSent]=useState(false);
 const[otp,setOtp]=useState("");
 const[firstName,setFirstName]=useState("");
 const[lastName,setLastName]=useState("");
 const[phone,setPhone]=useState("");
 const[email,setEmail]=useState("");
 const[password,setPassword]=useState("");
 const[showPassword,setShowPassword]=useState(false);
 const{login,register,requestPhoneOtp,verifyPhoneOtp,loading}=useSession();

 const submit=async()=>{
  if(phoneMode){
   if(!phone.trim())return Alert.alert("Mobile number required","Enter your mobile number.");
   try{
    if(!otpSent){
     const result=await requestPhoneOtp(phone);
     setOtpSent(true);
     Alert.alert("OTP sent",result?.message??"Verification code sent by SMS.");
     return;
    }
    if(!otp.trim())return Alert.alert("OTP required","Enter the verification code sent to your phone.");
    await verifyPhoneOtp(phone,otp);
   }catch(error){Alert.alert(otpSent?"OTP verification failed":"Unable to send OTP",apiError(error));}
   return;
  }
  if(!email.trim()||!password)return Alert.alert("Missing details","Enter your email and password.");
  if(registerMode&&(firstName.trim().length<2||lastName.trim().length<2))
   return Alert.alert("Check your name","First and last name need at least 2 characters.");
  if(registerMode&&(password.length<8||!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)))
   return Alert.alert("Password requirements","Use 8+ characters with uppercase, lowercase and a number.");
  try{
   if(registerMode){
    const result=await register({firstName,lastName,email,password,phone});
    Alert.alert("Verify your email",result.message,[{text:"Go to sign in",onPress:()=>{setRegisterMode(false);setPassword("");}}]);
   }else await login(email,password);
  }catch(error){Alert.alert(registerMode?"Registration failed":"Sign in failed",apiError(error));}
 };

 return <SafeAreaView style={styles.safe}>
  <LinearGradient colors={[C.midnight,C.midnightSoft,C.deepNavy,C.midnight]} locations={[0,.32,.7,1]} style={StyleSheet.absoluteFill}/>
  <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==="ios"?"padding":"height"} keyboardVerticalOffset={Platform.OS==="ios"?0:24}>
   <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
    <View style={styles.logoCrop}><View style={styles.logoMark}><Text style={styles.q}>Q</Text><Text style={styles.infinity}>âˆž</Text></View></View>
    <Text style={styles.brand}>OMIQORA</Text>
    <Text style={styles.tag}>ONE PLATFORM Â· INFINITE POSSIBILITIES</Text>
    <View style={styles.card}>
     <Text style={styles.eyebrow}>{registerMode?"BEGIN YOUR JOURNEY":"WELCOME TO OMIQORA"}</Text>
     <Text style={styles.title}>{registerMode?"Create your account":"Welcome back"}</Text>
     <Text style={styles.sub}>{registerMode?"Join the trusted services ecosystem.":"Your world of trusted services, thoughtfully connected in one place."}</Text>
     {registerMode&&!phoneMode&&<>
      <AuthField icon={<UserRound size={18} color={C.goldLight}/>} placeholder="First name" value={firstName} onChangeText={setFirstName}/>
      <AuthField icon={<UserRound size={18} color={C.goldLight}/>} placeholder="Last name" value={lastName} onChangeText={setLastName}/>
     </>}
     {phoneMode?<>
      <AuthField icon={<Phone size={18} color={C.goldLight}/>} placeholder="+91 mobile number" value={phone}
       onChangeText={v=>{setPhone(v);setOtpSent(false);setOtp("");}} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"/>
      {otpSent&&<AuthField icon={<LockKeyhole size={18} color={C.goldLight}/>} placeholder="Verification code" value={otp}
       onChangeText={setOtp} keyboardType="phone-pad" autoComplete="one-time-code" textContentType="oneTimeCode"/>}
     </>:<>
      <AuthField icon={<Mail size={18} color={C.goldLight}/>} placeholder="Email address" value={email}
       onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress"/>
      {registerMode&&<AuthField icon={<Phone size={18} color={C.goldLight}/>} placeholder="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>}
      <View style={styles.field}><LockKeyhole size={18} color={C.goldLight}/><TextInput
       style={styles.input} placeholder="Password" placeholderTextColor={C.mutedSoft}
       value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
       autoCapitalize="none" autoComplete="off" textContentType="none"
      /><Pressable onPress={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={20} color={C.muted}/>:<Eye size={20} color={C.muted}/>}</Pressable></View>
     </>}
     <Pressable onPress={submit} disabled={loading} style={styles.cta}>
      {loading?<ActivityIndicator color={C.midnight}/>:<Text style={styles.ctaText}>{phoneMode?(otpSent?"Verify OTP":"Send OTP"):(registerMode?"Create account":"Sign in")}</Text>}
     </Pressable>
     {!registerMode&&<Pressable style={styles.switch} onPress={()=>{setPhoneMode(v=>!v);setOtpSent(false);setOtp("");}}>
      <Text style={styles.switchText}>{phoneMode?"Sign in with email":"Sign in with mobile OTP"}</Text>
     </Pressable>}
     {!phoneMode&&<Pressable style={styles.switch} onPress={()=>setRegisterMode(v=>!v)}>
      <Text style={styles.switchText}>{registerMode?"Already have an account? Sign in":"New to OMIQORA? Create account"}</Text>
     </Pressable>}
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.midnight},flex:{flex:1},content:{flexGrow:1,paddingHorizontal:28,paddingTop:22,paddingBottom:80,justifyContent:"center"},
 logoCrop:{alignSelf:"center",width:118,height:118,marginBottom:10,alignItems:"center",justifyContent:"center"},
 logoMark:{width:104,height:104,borderRadius:28,borderWidth:1,borderColor:C.gold,backgroundColor:"#02091b",alignItems:"center",justifyContent:"center"},
 q:{fontSize:70,lineHeight:76,fontWeight:"300",fontStyle:"italic",color:C.goldLight},infinity:{position:"absolute",fontSize:36,color:C.goldLight,bottom:18},
 brand:{textAlign:"center",fontSize:34,letterSpacing:8,fontWeight:"800",color:C.goldLight},tag:{textAlign:"center",fontSize:11,letterSpacing:1.6,color:C.muted,marginTop:10,marginBottom:28},
 card:{borderWidth:1,borderColor:"rgba(218,170,55,.65)",borderRadius:30,padding:24,backgroundColor:"rgba(5,20,52,.94)"},
 eyebrow:{fontSize:12,letterSpacing:2,color:C.goldLight,fontWeight:"800"},title:{fontSize:34,color:C.white,fontWeight:"800",marginTop:22},
 sub:{fontSize:16,lineHeight:24,color:C.muted,marginTop:12,marginBottom:22},field:{minHeight:64,borderWidth:1,borderColor:"rgba(164,177,205,.28)",borderRadius:22,marginBottom:14,paddingHorizontal:18,flexDirection:"row",alignItems:"center",gap:12},
 input:{flex:1,color:C.white,fontSize:17,paddingVertical:16},cta:{minHeight:64,borderRadius:22,backgroundColor:C.goldLight,alignItems:"center",justifyContent:"center",marginTop:8},
 ctaText:{color:C.midnight,fontSize:18,fontWeight:"800"},switch:{paddingVertical:15,alignItems:"center"},switchText:{color:C.goldLight,fontWeight:"700"}
});
