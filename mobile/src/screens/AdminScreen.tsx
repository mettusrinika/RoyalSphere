import React,{useCallback,useEffect,useMemo,useState} from "react";
import {ActivityIndicator,Alert,Pressable,RefreshControl,ScrollView,StyleSheet,Text,View} from "react-native";
import {CalendarDays,CreditCard,RefreshCw,ShieldCheck,Store,Users} from "lucide-react-native";
import {endpoints,errMsg,listOf,unwrap} from "../api";
import {OMIQORA} from "../theme";

const C=OMIQORA.colors;

const money=(value:any)=>`\u20B9${Number(value??0).toLocaleString("en-IN",{maximumFractionDigits:2})}`;
const label=(value:string)=>value.replace(/([A-Z])/g," $1").replace(/^./,x=>x.toUpperCase());
const amountKey=(key:string)=>/revenue|amount|spent|payout|earning|payment/i.test(key);

export function AdminScreen(){
 const [overview,setOverview]=useState<any>(null);
 const [applications,setApplications]=useState<any[]>([]);
 const [bookings,setBookings]=useState<any[]>([]);
 const [payments,setPayments]=useState<any[]>([]);
 const [busy,setBusy]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState("");

 const load=useCallback(async(silent=false)=>{
  if(!silent)setBusy(true);
  setError("");
  try{
   const [o,a,b,p]=await Promise.all([
    endpoints.adminOverview(),
    endpoints.adminVendorApplications(),
    endpoints.adminBookings(),
    endpoints.adminPayments(),
   ]);
   setOverview(unwrap(o));
   setApplications(listOf(a));
   setBookings(listOf(b));
   setPayments(listOf(p));
  }catch(e){
   setError(errMsg(e));
  }finally{
   setBusy(false);
   setRefreshing(false);
  }
 },[]);

 useEffect(()=>{void load()},[load]);

 const metrics=useMemo(
  ()=>Object.entries(overview??{}).filter(([,v])=>typeof v==="number").slice(0,10),
  [overview],
 );

 const decide=async(id:string,status:"approved"|"rejected")=>{
  try{
   if(status==="approved")await endpoints.adminApproveVendor(id);
   else await endpoints.adminRejectVendor(id,{reason:"Rejected by OMIQORA admin review."});
   await load(true);
  }catch(e){
   Alert.alert("Vendor application",errMsg(e));
  }
 };

 if(busy){
  return <View style={s.center}><ActivityIndicator color={C.gold}/></View>;
 }

 return (
  <ScrollView
   style={s.page}
   contentContainerStyle={s.content}
   refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load(true)}} tintColor={C.gold}/>}
  >
   <View style={s.hero}>
    <ShieldCheck size={28} color={C.goldLight}/>
    <Text style={s.title}>Admin operations</Text>
    <Text style={s.copy}>Live OMIQORA platform controls and production data.</Text>
   </View>

   {error?<View style={s.errorCard}><Text style={s.error}>{error}</Text><Pressable style={s.button} onPress={()=>void load()}><RefreshCw size={16} color={C.midnight}/><Text style={s.buttonText}>Retry</Text></Pressable></View>:null}

   <Text style={s.section}>LIVE OVERVIEW</Text>
   <View style={s.grid}>
    {metrics.map(([key,value])=>(
     <View style={s.card} key={key}>
      <Text style={s.value}>{amountKey(key)?money(value):Number(value).toLocaleString("en-IN",{maximumFractionDigits:2})}</Text>
      <Text style={s.label}>{label(key)}</Text>
     </View>
    ))}
   </View>

   <Text style={s.section}>VENDOR APPLICATIONS</Text>
   {applications.length===0?<Text style={s.copy}>No vendor applications returned by the admin API.</Text>:applications.slice(0,10).map((item:any)=>{
    const id=String(item?._id??item?.id??"");
    const status=String(item?.status??"pending");
    return (
     <View style={s.rowCard} key={id}>
      <View style={s.icon}><Store size={18} color={C.gold}/></View>
      <View style={s.flex}>
       <Text style={s.rowTitle}>{item?.businessName??item?.vendorType??"Vendor application"}</Text>
       <Text style={s.rowMeta}>{status.toUpperCase()} · {item?.serviceLocation?.city??item?.city??"Location pending"}</Text>
      </View>
      {status==="pending"?<View style={s.actions}>
       <Pressable style={s.smallGold} onPress={()=>void decide(id,"approved")}><Text style={s.smallGoldText}>Approve</Text></Pressable>
       <Pressable style={s.smallDanger} onPress={()=>void decide(id,"rejected")}><Text style={s.smallDangerText}>Reject</Text></Pressable>
      </View>:null}
     </View>
    );
   })}

   <Text style={s.section}>BOOKINGS</Text>
   <Summary icon={<CalendarDays size={19} color={C.gold}/>} title="Platform bookings" value={`${bookings.length.toLocaleString("en-IN")} returned by the admin API`}/>
   {bookings.slice(0,8).map((item:any)=>(
    <View style={s.listCard} key={String(item?._id??item?.id)}>
     <Text style={s.rowTitle}>{item?.bookingNumber??"Booking"}</Text>
     <Text style={s.rowMeta}>{String(item?.status??"unknown").toUpperCase()} · {money(item?.totalAmount??item?.amount)}</Text>
    </View>
   ))}

   <Text style={s.section}>TRANSACTIONS AND REFUNDS</Text>
   <Summary icon={<CreditCard size={19} color={C.gold}/>} title="Platform payments" value={`${payments.length.toLocaleString("en-IN")} returned by the admin payment API`}/>
   {payments.slice(0,10).map((item:any)=>(
    <View style={s.listCard} key={String(item?._id??item?.id)}>
     <Text style={s.rowTitle}>{money(item?.amount)}</Text>
     <Text style={s.rowMeta}>{String(item?.status??"unknown").toUpperCase()} · {item?.bookingId?.bookingNumber??item?.bookingNumber??"Payment"}</Text>
     {String(item?.status??"").toLowerCase()==="captured"||String(item?.status??"").toLowerCase()==="paid"?(
      <Pressable
       style={s.refund}
       onPress={()=>Alert.alert("Refund control","Open the payment detail/refund workflow only after confirming the exact refund amount and reason. No automatic refund is executed from the overview.")}
      >
       <Text style={s.refundText}>Refund controls</Text>
      </Pressable>
     ):null}
    </View>
   ))}

   <Text style={s.section}>OPERATIONS</Text>
   <Summary icon={<Users size={19} color={C.gold}/>} title="Role access" value="Admin navigation is isolated from customer and vendor actions."/>
  </ScrollView>
 );
}

function Summary({icon,title,value}:{icon:React.ReactNode;title:string;value:string}){
 return <View style={s.rowCard}><View style={s.icon}>{icon}</View><View style={s.flex}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowMeta}>{value}</Text></View></View>;
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.midnight},
 content:{padding:19,paddingBottom:40},
 center:{flex:1,backgroundColor:C.midnight,alignItems:"center",justifyContent:"center"},
 hero:{borderRadius:25,borderWidth:1,borderColor:C.borderStrong,backgroundColor:C.royalNavy,padding:21},
 title:{color:C.white,fontSize:25,fontWeight:"900",marginTop:12},
 copy:{color:C.muted,fontSize:11,lineHeight:18,marginTop:7},
 section:{color:C.gold,fontSize:9,fontWeight:"900",letterSpacing:1.7,marginTop:27,marginBottom:12},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:10},
 card:{width:"48%",minHeight:105,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.elevatedNavy,padding:16,justifyContent:"center"},
 value:{color:C.white,fontSize:21,fontWeight:"900"},
 label:{color:C.muted,fontSize:10,marginTop:8,textTransform:"capitalize"},
 rowCard:{minHeight:72,borderRadius:18,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,padding:13,marginBottom:9,flexDirection:"row",alignItems:"center",gap:11},
 listCard:{borderRadius:17,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,padding:14,marginBottom:8},
 icon:{width:42,height:42,borderRadius:14,backgroundColor:C.elevatedNavy,alignItems:"center",justifyContent:"center"},
 flex:{flex:1},
 rowTitle:{color:C.white,fontSize:12,fontWeight:"900"},
 rowMeta:{color:C.muted,fontSize:9,lineHeight:15,marginTop:5},
 actions:{gap:5},
 smallGold:{borderRadius:10,backgroundColor:C.gold,paddingHorizontal:9,paddingVertical:7},
 smallGoldText:{color:C.midnight,fontSize:8,fontWeight:"900"},
 smallDanger:{borderRadius:10,borderWidth:1,borderColor:C.dangerBorder,paddingHorizontal:9,paddingVertical:7},
 smallDangerText:{color:C.danger,fontSize:8,fontWeight:"900"},
 refund:{alignSelf:"flex-start",marginTop:10,borderRadius:10,borderWidth:1,borderColor:C.borderStrong,paddingHorizontal:10,paddingVertical:7},
 refundText:{color:C.goldLight,fontSize:8,fontWeight:"900"},
 errorCard:{marginTop:15},
 error:{color:C.danger,fontSize:10,lineHeight:16},
 button:{height:45,borderRadius:14,backgroundColor:C.gold,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:7,marginTop:10},
 buttonText:{color:C.midnight,fontSize:10,fontWeight:"900"},
});