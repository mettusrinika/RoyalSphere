import React,{useCallback,useEffect,useState} from "react";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import {ActivityIndicator,Alert,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {ArrowLeft,BriefcaseBusiness,FileCheck2,MapPin,RefreshCw,Upload} from "lucide-react-native";
import {api,endpoints,errMsg,listOf,unwrap} from "../api";
import {useSession} from "../stores/session";
import {OMIQORA} from "../theme";
const C=OMIQORA.colors;
const F=({label,value,setValue,secure=false}:{label:string;value:string;setValue:(v:string)=>void;secure?:boolean})=><TextInput style={s.field} placeholder={label} placeholderTextColor={C.mutedSoft} value={value} onChangeText={setValue} secureTextEntry={secure}/>;
export function VendorScreen({onBack}:{onBack:()=>void}){
 const user=useSession(x=>x.user),[overview,setOverview]=useState<any>(null),[services,setServices]=useState<any[]>([]),[bookings,setBookings]=useState<any[]>([]),[payments,setPayments]=useState<any[]>([]),[application,setApplication]=useState<any>(null),[busy,setBusy]=useState(true),[error,setError]=useState(""),[resubmit,setResubmit]=useState(false);
 const[vendorType,setVendorType]=useState<"individual"|"business">("individual"),[businessName,setBusinessName]=useState(""),[description,setDescription]=useState(""),[registration,setRegistration]=useState(""),[city,setCity]=useState(""),[state,setState]=useState(""),[address,setAddress]=useState(""),[businessPhone,setBusinessPhone]=useState("");
 const[panNumber,setPanNumber]=useState(""),[accountName,setAccountName]=useState(""),[accountNumber,setAccountNumber]=useState(""),[ifscCode,setIfscCode]=useState(""),[bankName,setBankName]=useState(""),[portfolio,setPortfolio]=useState("");
 const load=useCallback(async()=>{setBusy(true);setError("");try{if(user?.role==="vendor"||user?.isVendorApproved){const[o,sv,bk,py]=await Promise.all([endpoints.vendorOverview(),endpoints.myServices(),endpoints.bookings(),endpoints.payments()]);setOverview(unwrap(o));setServices(listOf(sv));setBookings(listOf(bk));setPayments(listOf(py));}else{setApplication(unwrap(await endpoints.vendorApplication()));}}catch(e:any){if(e?.response?.status===404)setApplication(null);else setError(errMsg(e));}finally{setBusy(false);}},[user]);
 useEffect(()=>{load()},[load]);
 const locate=async()=>{const p=await Location.requestForegroundPermissionsAsync();if(p.status!=="granted"){Alert.alert("Location permission required","OMIQORA uses your location to save the operating address and serviceability coordinates.");throw new Error("Location permission is required.");}const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});const a=(await Location.reverseGeocodeAsync(pos.coords))[0];const nextCity=a?.city??a?.district??city;const nextState=a?.region??state;const nextAddress=[a?.name,a?.street,a?.district,a?.city,a?.region,a?.postalCode].filter(Boolean).join(", ")||address;setCity(nextCity);setState(nextState);setAddress(nextAddress);return {latitude:pos.coords.latitude,longitude:pos.coords.longitude,city:nextCity,state:nextState,address:nextAddress};};
 const apply=async()=>{try{
  if(!businessName.trim())return Alert.alert("Name required","Enter the business or individual vendor name.");
  if(description.trim().length<20)return Alert.alert("Description required","Enter at least 20 characters.");
  if(vendorType==="business"&&!registration.trim())return Alert.alert("Business registration required","Enter the business registration number/details.");
  if(!businessPhone.trim())return Alert.alert("Business phone required");
  if(!panNumber.trim())return Alert.alert("PAN required");
  if(!accountName.trim()||!accountNumber.trim()||!ifscCode.trim()||!bankName.trim())return Alert.alert("Bank details required","Complete all bank / payout fields.");
  setBusy(true);const point=await locate();
  const data:any=unwrap(await endpoints.applyVendor({vendorType,businessName:businessName.trim(),businessDescription:description.trim(),businessRegistrationNumber:registration.trim()||undefined,categories:["general"],city:point.city,state:point.state,address:point.address,businessPhone:businessPhone.trim(),panNumber:panNumber.trim().toUpperCase(),portfolioLinks:portfolio.split(",").map(x=>x.trim()).filter(Boolean),bankDetails:{accountName:accountName.trim(),accountNumber:accountNumber.trim(),ifscCode:ifscCode.trim().toUpperCase(),bankName:bankName.trim()},serviceLocation:{formattedAddress:point.address,city:point.city,state:point.state,latitude:point.latitude,longitude:point.longitude,serviceRadiusKm:25}}));
  setApplication(data);setResubmit(false);Alert.alert("Vendor application submitted","Upload identity, address and work proof documents next.");
 }catch(e){Alert.alert("Application failed",errMsg(e));}finally{setBusy(false);}};
 const upload=async(type:string)=>{try{const pick=await DocumentPicker.getDocumentAsync({type:["image/jpeg","image/png","image/webp","application/pdf"],copyToCacheDirectory:true});if(pick.canceled)return;const asset=pick.assets[0];const form=new FormData();form.append("type",type);form.append("file",{uri:asset.uri,name:asset.name,mimeType:asset.mimeType,type:asset.mimeType} as any);await api.post("/vendor-applications/upload-document",form,{headers:{"Content-Type":"multipart/form-data"}});Alert.alert("Uploaded",`${type.replaceAll("_"," ")} submitted for review.`);await load();}catch(e){Alert.alert("Upload failed",errMsg(e));}};
 if(busy)return <View style={s.center}><ActivityIndicator color={C.gold}/></View>;
 const showForm=!application||resubmit;
 return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><View style={s.header}><Pressable onPress={onBack}><ArrowLeft size={20} color={C.goldLight}/></Pressable><Text style={s.title}>Vendor verification</Text></View>
 {error?<><Text style={s.error}>{error}</Text><Pressable onPress={load} style={s.cta}><RefreshCw size={16}/><Text style={s.ctaText}>Retry</Text></Pressable></>:user?.role==="vendor"||user?.isVendorApproved?<><View style={s.hero}><BriefcaseBusiness size={25} color={C.goldLight}/><Text style={s.heroTitle}>Verified vendor workspace</Text></View><Text style={s.section}>OVERVIEW</Text>{Object.entries(overview??{}).filter(([,v])=>typeof v==="number").slice(0,6).map(([k,v])=><Text style={s.copy} key={k}>{k}: {String(v)}</Text>)}<Text style={s.section}>MY SERVICES</Text>{services.map((x,i)=><Text style={s.copy} key={String(x?._id??i)}>{x?.name} · {x?.status}</Text>)}</>:!showForm&&application?<><View style={s.hero}><FileCheck2 size={25} color={C.goldLight}/><Text style={s.heroTitle}>Application: {application.status}</Text><Text style={s.copy}>KYC documents are reviewed by OMIQORA admins. Sensitive bank details are not returned by the API.</Text>{application.rejectionReason?<Text style={s.error}>{application.rejectionReason}</Text>:null}</View><Text style={s.section}>IDENTITY, ADDRESS & WORK PROOFS</Text>{["aadhaar","pan","gst","business_license","address_proof","profile_photo","shop_photo","portfolio","work_proof"].map(t=><Pressable key={t} style={s.upload} onPress={()=>upload(t)}><Upload size={17} color={C.goldLight}/><Text style={s.uploadText}>Upload {t.replaceAll("_"," ")}</Text></Pressable>)}{application.status==="rejected"?<Pressable style={s.cta} onPress={()=>setResubmit(true)}><Text style={s.ctaText}>Update and resubmit</Text></Pressable>:null}</>:<><View style={s.hero}><MapPin size={25} color={C.goldLight}/><Text style={s.heroTitle}>Real vendor onboarding</Text><Text style={s.copy}>Identity, business, bank, address, location and proof details are submitted to the live API.</Text></View>
 <Text style={s.section}>VENDOR TYPE</Text><View style={s.row}><Pressable style={[s.choice,vendorType==="individual"&&s.choiceOn]} onPress={()=>setVendorType("individual")}><Text style={s.choiceText}>Individual</Text></Pressable><Pressable style={[s.choice,vendorType==="business"&&s.choiceOn]} onPress={()=>setVendorType("business")}><Text style={s.choiceText}>Business</Text></Pressable></View>
 <F label="Business / individual name" value={businessName} setValue={setBusinessName}/><F label="Business description (20+ characters)" value={description} setValue={setDescription}/>{vendorType==="business"?<F label="Business registration number/details" value={registration} setValue={setRegistration}/>:null}<F label="Business phone (+91...)" value={businessPhone} setValue={setBusinessPhone}/><F label="PAN number" value={panNumber} setValue={setPanNumber}/><F label="City" value={city} setValue={setCity}/><F label="State" value={state} setValue={setState}/><F label="Full address" value={address} setValue={setAddress}/><F label="Portfolio links, comma separated" value={portfolio} setValue={setPortfolio}/>
 <Text style={s.section}>BANK / PAYOUT DETAILS</Text><F label="Account holder / business name" value={accountName} setValue={setAccountName}/><F label="Account number" value={accountNumber} setValue={setAccountNumber} secure/><F label="IFSC code" value={ifscCode} setValue={setIfscCode}/><F label="Bank name" value={bankName} setValue={setBankName}/>
 <Pressable style={s.cta} onPress={apply}><Text style={s.ctaText}>Use location & {application?.status==="rejected"?"resubmit":"submit application"}</Text></Pressable></>}<Text style={s.section}>BOOKING OPERATIONS</Text>
<View style={s.card}>
 <Text style={s.label}>LIVE BOOKINGS</Text>
 <Text style={s.details}>{bookings.length.toLocaleString("en-IN")} bookings returned by the authenticated vendor booking contract.</Text>
 {bookings.slice(0,6).map((item:any)=><View key={String(item?._id??item?.id)} style={s.line}><BriefcaseBusiness size={16} color={C.gold}/><Text style={s.value}>{item?.bookingNumber??"Booking"} · {String(item?.status??"unknown").toUpperCase()}</Text></View>)}
</View>

<Text style={s.section}>EARNINGS AND PAYOUTS</Text>
<View style={s.card}>
 <Text style={s.label}>REAL PAYMENT HISTORY</Text>
 <Text style={s.details}>{payments.length.toLocaleString("en-IN")} payment records returned by the authenticated payment contract.</Text>
 {payments.slice(0,6).map((item:any)=><View key={String(item?._id??item?.id)} style={s.line}><FileCheck2 size={16} color={C.gold}/><Text style={s.value}>₹{Number(item?.vendorPayoutAmount??item?.amount??0).toLocaleString("en-IN",{maximumFractionDigits:2})} · {String(item?.status??"unknown").toUpperCase()}</Text></View>)}
</View>

<Text style={s.section}>AVAILABILITY AND SERVICE OPERATIONS</Text>
<View style={s.card}>
 <Text style={s.label}>SERVICE CATALOG</Text>
 <Text style={s.details}>{services.length.toLocaleString("en-IN")} services are connected to this vendor workspace. Availability remains authoritative in the existing service and booking contracts.</Text>
 {services.slice(0,6).map((item:any)=><View key={String(item?._id??item?.id)} style={s.line}><MapPin size={16} color={C.gold}/><Text style={s.value}>{item?.name??"Service"} · {String(item?.status??"unknown").toUpperCase()}</Text></View>)}
</View></ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.midnight},content:{padding:20,paddingBottom:70},center:{flex:1,backgroundColor:C.midnight,alignItems:"center",justifyContent:"center"},header:{height:60,flexDirection:"row",alignItems:"center",gap:16},title:{color:C.white,fontSize:22,fontWeight:"800"},hero:{padding:20,borderRadius:22,backgroundColor:C.deepNavy,marginVertical:16},heroTitle:{color:C.white,fontSize:20,fontWeight:"800",marginTop:10},copy:{color:C.muted,lineHeight:22,marginTop:8},section:{color:C.goldLight,fontWeight:"800",letterSpacing:1.4,marginTop:22,marginBottom:10},field:{minHeight:56,borderWidth:1,borderColor:C.border,borderRadius:16,color:C.white,paddingHorizontal:16,marginBottom:12},upload:{minHeight:52,borderWidth:1,borderColor:C.border,borderRadius:16,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:16,marginBottom:10},uploadText:{color:C.white,textTransform:"capitalize"},cta:{minHeight:58,borderRadius:18,backgroundColor:C.goldLight,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8,marginTop:18},ctaText:{color:C.midnight,fontWeight:"800"},error:{color:"#ff9b9b",marginTop:10},row:{flexDirection:"row",gap:10,marginBottom:12},choice:{flex:1,minHeight:50,borderWidth:1,borderColor:C.border,borderRadius:16,alignItems:"center",justifyContent:"center"},choiceOn:{backgroundColor:C.deepNavy,borderColor:C.goldLight},choiceText:{color:C.white,fontWeight:"700"},
 card:{
  backgroundColor:C.elevatedNavy,
  borderWidth:1,
  borderColor:C.border,
  borderRadius:18,
  padding:16,
  marginTop:14
 },
 label:{
  color:C.gold,
  fontSize:11,
  fontWeight:"800",
  letterSpacing:1.2,
  marginBottom:8
 },
 details:{
  color:C.muted,
  fontSize:13,
  lineHeight:19,
  marginBottom:10
 },
 line:{
  flexDirection:"row",
  alignItems:"center",
  gap:8,
  paddingVertical:8,
  borderTopWidth:1,
  borderTopColor:C.border
 },
 value:{
  color:C.text,
  fontSize:13,
  flex:1
 },});
