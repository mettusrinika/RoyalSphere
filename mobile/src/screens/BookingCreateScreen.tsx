import React,{useState} from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import {ActivityIndicator,Alert,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {ArrowLeft,CalendarDays,MapPin,Navigation,Sparkles} from "lucide-react-native";
import {endpoints,errMsg,unwrap} from "../api";
import {OMIQORA} from "../theme";
const C=OMIQORA.colors;
export function BookingCreateScreen({service,onBack,onCreated}:{service:any;onBack:()=>void;onCreated:(id:string)=>void}){
 const[fromDate,setFromDate]=useState<Date|null>(null),[toDate,setToDate]=useState<Date|null>(null);
 const[picker,setPicker]=useState<"from"|"to"|null>(null),[eventLocation,setEventLocation]=useState("");
 const[eventDetails,setEventDetails]=useState(""),[busy,setBusy]=useState(false),[coords,setCoords]=useState<{latitude:number;longitude:number}|null>(null);
 const serviceId=String(service?._id??service?.id??"");
 const base=Number(service?.basePrice??service?.price??0);
 const days=fromDate&&toDate?Math.max(1,Math.floor((new Date(toDate).setHours(0,0,0,0)-new Date(fromDate).setHours(0,0,0,0))/86400000)+1):1;
 const estimate=service?.priceType==="per_day"?base*days:base;
 const useLocation=async()=>{
  try{
   const permission=await Location.requestForegroundPermissionsAsync();
   if(permission.status!=="granted")return Alert.alert("Location permission","Location permission is required to check serviceability.");
   const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
   const point={latitude:position.coords.latitude,longitude:position.coords.longitude};setCoords(point);
   const result:any=unwrap(await endpoints.checkServiceability(serviceId,point.latitude,point.longitude));
   const address=await Location.reverseGeocodeAsync(point);
   const a=address[0]; if(a)setEventLocation([a.name,a.street,a.district,a.city,a.region,a.postalCode].filter(Boolean).join(", "));
   Alert.alert(result?.serviceable?"Service available":"Outside service area",result?.reason??(result?.serviceable?"This service can serve your location.":"This service is not available at your location."));
  }catch(e){Alert.alert("Location check failed",errMsg(e));}
 };
 const submit=async()=>{
  if(!serviceId)return Alert.alert("Booking","Service is missing.");
  if(!fromDate)return Alert.alert("From date","Choose the booking start date.");
  const end=toDate??fromDate;
  if(end<fromDate)return Alert.alert("Date range","To date cannot be before from date.");
  if(!eventLocation.trim())return Alert.alert("Location","Choose your current location or enter the venue.");
  setBusy(true);
  try{
   if(coords){const result:any=unwrap(await endpoints.checkServiceability(serviceId,coords.latitude,coords.longitude));if(result?.serviceable===false)throw new Error(result?.reason??"Service is not available at this location.");}
   const booking:any=unwrap(await endpoints.createBooking({serviceId,eventDate:fromDate.toISOString(),eventEndDate:end.toISOString(),eventLocation:eventLocation.trim(),eventDetails:eventDetails.trim()}));
   const id=String(booking?._id??booking?.id??"");if(!id)throw new Error("Booking id was not returned.");onCreated(id);
  }catch(e){Alert.alert("Unable to create booking",errMsg(e));}finally{setBusy(false);}
 };
 const DateField=({label,value,type}:{label:string;value:Date|null;type:"from"|"to"})=><><Text style={s.label}>{label}</Text><Pressable style={s.field} onPress={()=>setPicker(type)}><CalendarDays size={18} color={C.gold}/><Text style={[s.input,{color:value?C.white:C.mutedSoft}]}>{value?value.toLocaleDateString("en-IN"):"Choose date"}</Text></Pressable></>;
 return <View style={s.page}><View style={s.header}><Pressable onPress={onBack} style={s.icon}><ArrowLeft size={20} color={C.gold}/></Pressable><Text style={s.title}>Create booking</Text></View>
  <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
   <View style={s.hero}><Sparkles size={20} color={C.gold}/><Text style={s.service}>{service?.name??"Selected service"}</Text><Text style={s.price}>Estimated â‚¹{estimate.toLocaleString("en-IN")} Â· server confirms final amount</Text></View>
   <DateField label="FROM DATE" value={fromDate} type="from"/><DateField label="TO DATE" value={toDate} type="to"/>
   {picker&&<DateTimePicker value={(picker==="from"?fromDate:toDate)??new Date()} mode="date" minimumDate={picker==="to"?(fromDate??new Date()):new Date()} onChange={(_,d)=>{const p=picker;setPicker(null);if(d){if(p==="from"){setFromDate(d);if(toDate&&toDate<d)setToDate(d);}else setToDate(d);}}}/>}
   <Text style={s.label}>EVENT LOCATION</Text><View style={s.field}><MapPin size={18} color={C.muted}/><TextInput value={eventLocation} onChangeText={setEventLocation} placeholder="Venue or address" placeholderTextColor={C.mutedSoft} style={s.input}/></View>
   <Pressable style={s.secondary} onPress={useLocation}><Navigation size={17} color={C.goldLight}/><Text style={s.secondaryText}>Use my location & check serviceability</Text></Pressable>
   {coords&&<Pressable style={s.secondary} onPress={()=>Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`)}><MapPin size={17} color={C.goldLight}/><Text style={s.secondaryText}>Open selected location in Google Maps</Text></Pressable>}
   <Text style={s.label}>DETAILS</Text><TextInput value={eventDetails} onChangeText={setEventDetails} placeholder="Tell the vendor what you need..." placeholderTextColor={C.mutedSoft} style={[s.field,s.multi]} multiline/>
   <Pressable onPress={submit} disabled={busy} style={s.cta}>{busy?<ActivityIndicator color={C.midnight}/>:<Text style={s.ctaText}>Request booking</Text>}</Pressable>
   <Text style={s.note}>OMIQORA calculates the authoritative amount on the backend from the service price type and selected date range.</Text>
  </ScrollView></View>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.midnight},header:{height:64,flexDirection:"row",alignItems:"center",paddingHorizontal:18,borderBottomWidth:1,borderBottomColor:C.border,gap:14},icon:{padding:8},title:{color:C.white,fontSize:20,fontWeight:"800"},content:{padding:20,paddingBottom:60},hero:{padding:20,borderRadius:22,backgroundColor:C.deepNavy,marginBottom:22},service:{color:C.white,fontSize:22,fontWeight:"800",marginTop:10},price:{color:C.goldLight,marginTop:8},label:{color:C.muted,fontSize:12,fontWeight:"800",letterSpacing:1.5,marginTop:16,marginBottom:8},field:{minHeight:58,borderWidth:1,borderColor:C.border,borderRadius:18,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:10},input:{flex:1,color:C.white,fontSize:16,paddingVertical:15},multi:{minHeight:120,textAlignVertical:"top",paddingTop:16},secondary:{minHeight:50,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderWidth:1,borderColor:C.border,borderRadius:16,marginTop:10},secondaryText:{color:C.goldLight,fontWeight:"700"},cta:{minHeight:58,borderRadius:18,backgroundColor:C.goldLight,alignItems:"center",justifyContent:"center",marginTop:24},ctaText:{color:C.midnight,fontWeight:"800",fontSize:17},note:{color:C.muted,lineHeight:20,marginTop:14}});
