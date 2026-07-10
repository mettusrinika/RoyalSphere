import React,{useRef,useState} from "react";
import {
 ActivityIndicator,Alert,Image,Keyboard,KeyboardAvoidingView,Platform,Pressable,ScrollView,
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
 icon:React.ReactNode;
 placeholder:string;
 value:string;
 onChangeText:(value:string)=>void;
 autoCapitalize?:"none"|"sentences"|"words"|"characters";
 keyboardType?:"default"|"email-address"|"phone-pad";
 autoComplete?:"email"|"off"|"tel"|"one-time-code";
 textContentType?:"emailAddress"|"none"|"telephoneNumber"|"oneTimeCode";
 returnKeyType?:"next"|"done"|"go";
 onSubmitEditing?:()=>void;
 inputRef?:React.RefObject<TextInput|null>;
 onFocus?:()=>void;
};

function AuthField({
 icon,
 inputRef,
 ...props
}:FieldProps){
 return (
  <View style={styles.field}>
   {icon}
   <TextInput
    ref={inputRef}
    style={styles.input}
    placeholderTextColor={C.mutedSoft}
    {...props}
   />
  </View>
 );
}

export function AuthScreen(){
 const scrollRef=useRef<ScrollView>(null);
 const emailRef=useRef<TextInput>(null);
 const passwordRef=useRef<TextInput>(null);
 const phoneRef=useRef<TextInput>(null);
 const otpRef=useRef<TextInput>(null);

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

 const{
  login,
  register,
  requestPhoneOtp,
  verifyPhoneOtp,
  loading,
 }=useSession();

 const revealFocusedArea=(y:number)=>{
  setTimeout(()=>{
   scrollRef.current?.scrollTo({
    y,
    animated:true,
   });
  },220);
 };

 const submit=async()=>{
  Keyboard.dismiss();

  if(phoneMode){
   if(!phone.trim()){
    return Alert.alert(
     "Mobile number required",
     "Enter your mobile number.",
    );
   }

   try{
    if(!otpSent){
     const otpStartedAt=Date.now();
     const result=await Promise.race([
      requestPhoneOtp(phone),
      new Promise<never>((_,reject)=>setTimeout(
       ()=>reject(new Error("OTP request timed out. Check your network and try again.")),
       30000,
      )),
     ]);
     console.info("OMIQORA OTP request completed",{
      durationMs:Date.now()-otpStartedAt,
     });
     setOtpSent(true);

     setTimeout(()=>{
      revealFocusedArea(260);
      otpRef.current?.focus();
     },250);

     Alert.alert(
      "OTP sent",
      result?.message??"Verification code sent by SMS.",
     );
     return;
    }

    if(!otp.trim()){
     return Alert.alert(
      "OTP required",
      "Enter the verification code sent to your phone.",
     );
    }

    await verifyPhoneOtp(phone,otp);
   }catch(error){
    Alert.alert(
     otpSent?"OTP verification failed":"Unable to send OTP",
     apiError(error),
    );
   }

   return;
  }

  if(!email.trim()||!password){
   return Alert.alert(
    "Missing details",
    "Enter your email and password.",
   );
  }

  if(
   registerMode&&
   (firstName.trim().length<2||lastName.trim().length<2)
  ){
   return Alert.alert(
    "Check your name",
    "First and last name need at least 2 characters.",
   );
  }

  if(
   registerMode&&
   (
    password.length<8||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
   )
  ){
   return Alert.alert(
    "Password requirements",
    "Use 8+ characters with uppercase, lowercase and a number.",
   );
  }

  try{
   if(registerMode){
    const result=await register({
     firstName,
     lastName,
     email,
     password,
     phone,
    });

    Alert.alert(
     "Verify your email",
     result.message,
     [{
      text:"Go to sign in",
      onPress:()=>{
       setRegisterMode(false);
       setPassword("");
      },
     }],
    );
   }else{
    await login(email,password);
   }
  }catch(error){
   Alert.alert(
    registerMode?"Registration failed":"Sign in failed",
    apiError(error),
   );
  }
 };

 return (
  <SafeAreaView style={styles.safe}>
   <LinearGradient
    colors={[
     C.midnight,
     C.midnightSoft,
     C.deepNavy,
     C.midnight,
    ]}
    locations={[0,.32,.7,1]}
    style={StyleSheet.absoluteFill}
   />

   <KeyboardAvoidingView
    style={styles.flex}
    behavior={Platform.OS==="ios"?"padding":undefined}
   >
    <ScrollView
     ref={scrollRef}
     style={styles.flex}
     contentContainerStyle={styles.content}
     keyboardShouldPersistTaps="handled"
     keyboardDismissMode={
      Platform.OS==="ios"?"interactive":"on-drag"
     }
     showsVerticalScrollIndicator={false}
     contentInsetAdjustmentBehavior="automatic"
    >
     <Pressable
      style={styles.dismissArea}
      onPress={Keyboard.dismiss}
     >
      <View style={styles.logoMark}><Image source={require("../../assets/omiqora-icon.png")} style={styles.logoImage} resizeMode="contain"/></View>

      <Text style={styles.brand}>OMIQORA</Text>

      <Text style={styles.tag}>
       ONE PLATFORM · INFINITE POSSIBILITIES
      </Text>
     </Pressable>

     <View style={styles.card}>
      <Text style={styles.eyebrow}>
       {registerMode
        ?"BEGIN YOUR JOURNEY"
        :"WELCOME TO OMIQORA"}
      </Text>

      <Text style={styles.title}>
       {registerMode
        ?"Create your account"
        :"Welcome back"}
      </Text>

      <Text style={styles.sub}>
       {registerMode
        ?"Join the trusted services ecosystem."
        :"Trusted services, connected in one place."}
      </Text>

      {registerMode&&!phoneMode&&(
       <>
        <AuthField
         icon={
          <UserRound
           size={17}
           color={C.goldLight}
          />
         }
         placeholder="First name"
         value={firstName}
         onChangeText={setFirstName}
         returnKeyType="next"
         onFocus={()=>revealFocusedArea(0)}
        />

        <AuthField
         icon={
          <UserRound
           size={17}
           color={C.goldLight}
          />
         }
         placeholder="Last name"
         value={lastName}
         onChangeText={setLastName}
         returnKeyType="next"
         onFocus={()=>revealFocusedArea(0)}
         onSubmitEditing={()=>emailRef.current?.focus()}
        />
       </>
      )}

      {phoneMode?(
       <>
        <AuthField
         inputRef={phoneRef}
         icon={
          <Phone
           size={17}
           color={C.goldLight}
          />
         }
         placeholder="+91 mobile number"
         value={phone}
         onChangeText={value=>{
          setPhone(value);
          setOtpSent(false);
          setOtp("");
         }}
         keyboardType="phone-pad"
         autoComplete="tel"
         textContentType="telephoneNumber"
         returnKeyType="done"
         onFocus={()=>revealFocusedArea(0)}
         onSubmitEditing={submit}
        />

        {otpSent&&(
         <AuthField
          inputRef={otpRef}
          icon={
           <LockKeyhole
            size={17}
            color={C.goldLight}
           />
          }
          placeholder="Verification code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="phone-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          returnKeyType="done"
          onFocus={()=>revealFocusedArea(0)}
          onSubmitEditing={submit}
         />
        )}
       </>
      ):(
       <>
        <AuthField
         inputRef={emailRef}
         icon={
          <Mail
           size={17}
           color={C.goldLight}
          />
         }
         placeholder="Email address"
         value={email}
         onChangeText={setEmail}
         autoCapitalize="none"
         keyboardType="email-address"
         autoComplete="email"
         textContentType="emailAddress"
         returnKeyType="next"
         onFocus={()=>revealFocusedArea(0)}
         onSubmitEditing={()=>passwordRef.current?.focus()}
        />

        {registerMode&&(
         <AuthField
          icon={
           <Phone
            size={17}
            color={C.goldLight}
           />
          }
          placeholder="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          returnKeyType="next"
          onFocus={()=>revealFocusedArea(0)}
          onSubmitEditing={()=>passwordRef.current?.focus()}
         />
        )}

        <View style={styles.field}>
         <LockKeyhole
          size={17}
          color={C.goldLight}
         />

         <TextInput
          ref={passwordRef}
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={C.mutedSoft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          returnKeyType="go"
          onFocus={()=>revealFocusedArea(220)}
          onSubmitEditing={submit}
         />

         <Pressable
          hitSlop={10}
          onPress={()=>setShowPassword(value=>!value)}
         >
          {showPassword?(
           <EyeOff
            size={19}
            color={C.muted}
           />
          ):(
           <Eye
            size={19}
            color={C.muted}
           />
          )}
         </Pressable>
        </View>
       </>
      )}

      <Pressable
       onPress={submit}
       disabled={loading}
       style={[
        styles.cta,
        loading&&styles.ctaDisabled,
       ]}
      >
       {loading?(
        <ActivityIndicator color={C.midnight}/>
       ):(
        <Text style={styles.ctaText}>
         {phoneMode
          ?otpSent
           ?"Verify OTP"
           :"Send OTP"
          :registerMode
           ?"Create account"
           :"Sign in"}
        </Text>
       )}
      </Pressable>

      {!registerMode&&(
       <Pressable
        style={styles.switch}
        onPress={()=>{
         Keyboard.dismiss();
         setPhoneMode(value=>!value);
         setOtpSent(false);
         setOtp("");
        }}
       >
        <Text style={styles.switchText}>
         {phoneMode
          ?"Sign in with email"
          :"Sign in with mobile OTP"}
        </Text>
       </Pressable>
      )}

      {!phoneMode&&(
       <Pressable
        style={styles.switch}
        onPress={()=>{
         Keyboard.dismiss();
         setRegisterMode(value=>!value);
        }}
       >
        <Text style={styles.switchText}>
         {registerMode
          ?"Already have an account? Sign in"
          :"New to OMIQORA? Create account"}
        </Text>
       </Pressable>
      )}
     </View>
    </ScrollView>
   </KeyboardAvoidingView>
  </SafeAreaView>
 );
}

const styles=StyleSheet.create({
 safe:{
  flex:1,
  backgroundColor:C.midnight,
 },
 flex:{
  flex:1,
 },
 content:{
  flexGrow:1,
  paddingHorizontal:20,
  paddingTop:18,
  paddingBottom:40,
 },
 dismissArea:{
  alignItems:"center",
 },
 logoImage:{width:"100%",height:"100%"},
 logoMark:{
  width:68,
  height:68,
  borderRadius:20,
  borderWidth:1,
  borderColor:C.gold,
  backgroundColor:"#02091b",
  alignItems:"center",
  justifyContent:"center",
 },
 q:{
  fontSize:46,
  lineHeight:50,
  fontWeight:"300",
  fontStyle:"italic",
  color:C.goldLight,
 },
 infinity:{
  position:"absolute",
  fontSize:23,
  color:C.goldLight,
  bottom:10,
 },
 brand:{
  textAlign:"center",
  fontSize:27,
  letterSpacing:6,
  fontWeight:"800",
  color:C.goldLight,
  marginTop:8,
 },
 tag:{
  textAlign:"center",
  fontSize:9,
  letterSpacing:1.2,
  color:C.muted,
  marginTop:5,
  marginBottom:14,
 },
 card:{
  borderWidth:1,
  borderColor:"rgba(218,170,55,.65)",
  borderRadius:22,
  padding:18,
  backgroundColor:"rgba(5,20,52,.94)",
 },
 eyebrow:{
  fontSize:10,
  letterSpacing:1.7,
  color:C.goldLight,
  fontWeight:"800",
 },
 title:{
  fontSize:27,
  color:C.white,
  fontWeight:"800",
  marginTop:10,
 },
 sub:{
  fontSize:14,
  lineHeight:20,
  color:C.muted,
  marginTop:6,
  marginBottom:14,
 },
 field:{
  minHeight:52,
  borderWidth:1,
  borderColor:"rgba(164,177,205,.28)",
  borderRadius:16,
  marginBottom:10,
  paddingHorizontal:14,
  flexDirection:"row",
  alignItems:"center",
  gap:10,
 },
 input:{
  flex:1,
  color:C.white,
  fontSize:15,
  paddingVertical:12,
 },
 cta:{
  minHeight:52,
  borderRadius:16,
  backgroundColor:C.goldLight,
  alignItems:"center",
  justifyContent:"center",
  marginTop:4,
 },
 ctaDisabled:{
  opacity:.7,
 },
 ctaText:{
  color:C.midnight,
  fontSize:16,
  fontWeight:"800",
 },
 switch:{
  paddingVertical:11,
  alignItems:"center",
 },
 switchText:{
  color:C.goldLight,
  fontWeight:"700",
  fontSize:13,
 },
});

