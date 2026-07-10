import React,{useCallback,useEffect,useMemo,useState} from "react";
import {ActivityIndicator,Alert,Pressable,RefreshControl,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {ArrowLeft,BarChart3,Bell,BookOpen,CalendarDays,ChevronRight,CircleDollarSign,MessageCircle,Plus,RefreshCw,Settings,Star,Store,UserRound} from "lucide-react-native";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {endpoints,errMsg,listOf,unwrap} from "../api";
import {useSession} from "../stores/session";
import {OMIQORA} from "../theme";

const C=OMIQORA.colors;
const Tabs=createBottomTabNavigator<any>();
const money=(v:any)=>`₹${Number(v??0).toLocaleString("en-IN",{maximumFractionDigits:2})}`;
const idOf=(x:any)=>String(x?._id??x?.id??"");
const titleOf=(x:any)=>x?.name??x?.serviceId?.name??x?.service?.name??x?.bookingNumber??"OMIQORA";
const Box=({children}:{children:React.ReactNode})=><View style={s.box}>{children}</View>;
const Empty=({title,copy}:{title:string;copy:string})=><Box><Text style={s.boxTitle}>{title}</Text><Text style={s.copy}>{copy}</Text></Box>;
const ErrorState=({message,retry}:{message:string;retry:()=>void})=><View style={s.center}><Text style={s.error}>{message}</Text><Pressable style={s.primary} onPress={retry}><RefreshCw size={16} color={C.midnight}/><Text style={s.primaryText}>Retry</Text></Pressable></View>;
const Header=({title,onBack,action}:{title:string;onBack?:()=>void;action?:React.ReactNode})=><View style={s.header}>{onBack?<Pressable style={s.icon} onPress={onBack}><ArrowLeft size={20} color={C.goldLight}/></Pressable>:<View style={s.icon}/>}<Text style={s.headerTitle}>{title}</Text>{action??<View style={s.icon}/>}</View>;

function useLoad<T>(loader:()=>Promise<T>,deps:any[]=[]){
 const[data,setData]=useState<T|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{setBusy(true);setError("");try{setData(await loader())}catch(e){setError(errMsg(e))}finally{setBusy(false)}},deps);
 useEffect(()=>{load()},[load]);
 return{data,busy,error,load,setData};
}

function Dashboard({navigation,root}:any){
 const user=useSession(x=>x.user);
 const q=useLoad(async()=>unwrap(await endpoints.vendorOverview()),[]);
 if(q.busy&&!q.data)return <View style={s.center}><ActivityIndicator color={C.gold}/></View>;
 if(q.error&&!q.data)return <ErrorState message={q.error} retry={q.load}/>;
 const o:any=q.data??{};
 const metrics=Object.entries(o).filter(([,v])=>typeof v==="number").slice(0,6);
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={q.busy} onRefresh={q.load} tintColor={C.gold}/>}>
  <View style={s.brandRow}><View><Text style={s.eyebrow}>VENDOR SPACE</Text><Text style={s.title}>Welcome{user?.firstName?`, ${user.firstName}`:""}</Text><Text style={s.copy}>Manage your OMIQORA business from one workspace.</Text></View><Store size={34} color={C.goldLight}/></View>
  <View style={s.metricGrid}>{metrics.length?metrics.map(([k,v])=><View style={s.metric} key={k}><Text style={s.metricValue}>{String(v)}</Text><Text style={s.metricLabel}>{k.replace(/([A-Z])/g," $1").trim()}</Text></View>):<Empty title="Live overview" copy="Your vendor statistics will appear when the API has business activity."/ >}</View>
  <Text style={s.section}>QUICK OPERATIONS</Text>
  <Action title="My services" copy="Create, open and edit your live service catalogue." icon={<Store size={20} color={C.goldLight}/>} onPress={()=>navigation.navigate("Services")}/>
  <Action title="Bookings" copy="Open booking details and perform valid status actions." icon={<CalendarDays size={20} color={C.goldLight}/>} onPress={()=>navigation.navigate("Bookings")}/>
  <Action title="Messages" copy="Open real customer conversations and chat." icon={<MessageCircle size={20} color={C.goldLight}/>} onPress={root.messages}/>
  <Action title="Notifications" copy="See service, booking and account updates." icon={<Bell size={20} color={C.goldLight}/>} onPress={root.notifications}/>
 </ScrollView>;
}
function Action({title,copy,icon,onPress}:{title:string;copy:string;icon:React.ReactNode;onPress:()=>void}){return <Pressable style={s.action} onPress={onPress}>{icon}<View style={s.actionText}><Text style={s.boxTitle}>{title}</Text><Text style={s.copy}>{copy}</Text></View><ChevronRight size={20} color={C.goldLight}/></Pressable>}

function Services({navigation}:any){
 const q=useLoad(async()=>listOf(await endpoints.myServices()),[]);
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={q.busy} onRefresh={q.load} tintColor={C.gold}/>}>
  <Header title="My services" action={<Pressable style={s.icon} onPress={()=>navigation.navigate("ServiceEditor")}><Plus size={21} color={C.goldLight}/></Pressable>}/>
  {q.error?<Text style={s.error}>{q.error}</Text>:null}
  {!q.busy&&!q.data?.length?<Empty title="No services yet" copy="Create your first service. OMIQORA will submit it through the real vendor service API."/>:null}
  {(q.data??[]).map((x:any)=><Pressable key={idOf(x)} style={s.box} onPress={()=>navigation.navigate("VendorServiceDetail",{serviceId:idOf(x)})}><View style={s.rowBetween}><Text style={s.boxTitle}>{titleOf(x)}</Text><Text style={s.status}>{String(x?.status??"").toUpperCase()}</Text></View><Text style={s.copy}>{x?.description??"Service details"}</Text><View style={s.rowBetween}><Text style={s.price}>{money(x?.basePrice)}</Text><ChevronRight size={19} color={C.goldLight}/></View></Pressable>)}
 </ScrollView>;
}

function ServiceEditor({route,navigation}:any){
 const serviceId=route.params?.serviceId as string|undefined;
 const[busy,setBusy]=useState(Boolean(serviceId)),[error,setError]=useState(""),[categories,setCategories]=useState<any[]>([]);
 const[name,setName]=useState(""),[description,setDescription]=useState(""),[basePrice,setBasePrice]=useState(""),[categoryId,setCategoryId]=useState(""),[priceType,setPriceType]=useState("fixed"),[city,setCity]=useState(""),[state,setState]=useState("");
 useEffect(()=>{(async()=>{try{const cats=listOf(await endpoints.categories());setCategories(cats);if(!categoryId&&cats[0])setCategoryId(idOf(cats[0]));if(serviceId){const x:any=unwrap(await endpoints.service(serviceId));setName(x?.name??"");setDescription(x?.description??"");setBasePrice(String(x?.basePrice??""));setCategoryId(String(x?.categoryId?._id??x?.categoryId??""));setPriceType(x?.priceType??"fixed");setCity(x?.location?.city??"");setState(x?.location?.state??"")}}catch(e){setError(errMsg(e))}finally{setBusy(false)}})()},[serviceId]);
 const save=async()=>{if(!name.trim()||description.trim().length<20||!categoryId||Number(basePrice)<0)return Alert.alert("Check service details","Name, category, price and a description of at least 20 characters are required.");setBusy(true);try{const body={name:name.trim(),description:description.trim(),categoryId,basePrice:Number(basePrice),priceType,tags:[],location:{city:city.trim(),state:state.trim(),serviceRadius:25},availability:{workingDays:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],startTime:"09:00",endTime:"18:00",blockedDates:[]},packages:[]};if(serviceId)await endpoints.updateService(serviceId,body);else await endpoints.createService(body);Alert.alert(serviceId?"Service updated":"Service created",serviceId?"Your service changes were saved.":"Your service was submitted through the live service API.");navigation.goBack()}catch(e){Alert.alert("Service not saved",errMsg(e))}finally{setBusy(false)}};
 if(busy&&serviceId&&!name)return <View style={s.center}><ActivityIndicator color={C.gold}/></View>;
 return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Header title={serviceId?"Edit service":"Add service"} onBack={navigation.goBack}/>{error?<Text style={s.error}>{error}</Text>:null}
  <Field label="Service name" value={name} set={setName}/><Field label="Description (20+ characters)" value={description} set={setDescription} multiline/><Field label="Base price in INR" value={basePrice} set={setBasePrice} keyboard="numeric"/>
  <Text style={s.label}>CATEGORY</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{categories.map((x:any)=><Pressable key={idOf(x)} style={[s.chip,categoryId===idOf(x)&&s.chipOn]} onPress={()=>setCategoryId(idOf(x))}><Text style={s.chipText}>{x?.name??x?.slug}</Text></Pressable>)}</ScrollView>
  <Text style={s.label}>PRICE TYPE</Text><View style={s.chips}>{["fixed","per_hour","per_day","per_event"].map(x=><Pressable key={x} style={[s.chip,priceType===x&&s.chipOn]} onPress={()=>setPriceType(x)}><Text style={s.chipText}>{x.replace("_"," ")}</Text></Pressable>)}</View>
  <Field label="Service city" value={city} set={setCity}/><Field label="Service state" value={state} set={setState}/>
  <Pressable style={s.primary} disabled={busy} onPress={save}>{busy?<ActivityIndicator color={C.midnight}/>:<Text style={s.primaryText}>{serviceId?"Save service":"Create service"}</Text>}</Pressable>
 </ScrollView>;
}
function Field({label,value,set,multiline=false,keyboard="default"}:{label:string;value:string;set:(v:string)=>void;multiline?:boolean;keyboard?:any}){return <TextInput style={[s.field,multiline&&s.multiline]} placeholder={label} placeholderTextColor={C.mutedSoft} value={value} onChangeText={set} multiline={multiline} keyboardType={keyboard}/>}

function ServiceDetail({route,navigation}:any){
 const id=route.params.serviceId;
 const q=useLoad(async()=>unwrap(await endpoints.service(id)),[id]);
 const remove=()=>Alert.alert("Delete service","This permanently removes the service.",[{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:async()=>{try{await endpoints.deleteService(id);navigation.goBack()}catch(e){Alert.alert("Service not deleted",errMsg(e))}}}]);
 if(q.busy&&!q.data)return <View style={s.center}><ActivityIndicator color={C.gold}/></View>;
 if(q.error&&!q.data)return <ErrorState message={q.error} retry={q.load}/>;
 const x:any=q.data;
 return <ScrollView style={s.page} contentContainerStyle={s.content}><Header title="Service details" onBack={navigation.goBack}/><Box><Text style={s.title}>{titleOf(x)}</Text><Text style={s.status}>{String(x?.status??"").toUpperCase()}</Text><Text style={s.copy}>{x?.description}</Text><Text style={s.price}>{money(x?.basePrice)} · {String(x?.priceType??"fixed").replace("_"," ")}</Text><Text style={s.copy}>{[x?.location?.city,x?.location?.state].filter(Boolean).join(", ")||"Service location not set"}</Text></Box><Pressable style={s.primary} onPress={()=>navigation.navigate("ServiceEditor",{serviceId:id})}><Text style={s.primaryText}>Edit service</Text></Pressable><Pressable style={s.dangerButton} onPress={remove}><Text style={s.dangerText}>Delete service</Text></Pressable></ScrollView>;
}

function Bookings({navigation}:any){
 const q=useLoad(async()=>listOf(await endpoints.vendorBookings()),[]);
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={q.busy} onRefresh={q.load} tintColor={C.gold}/>}><Header title="Vendor bookings"/>{q.error?<Text style={s.error}>{q.error}</Text>:null}{!q.busy&&!q.data?.length?<Empty title="No vendor bookings" copy="New customer bookings will appear here from the live booking API."/>:null}{(q.data??[]).map((x:any)=><Pressable style={s.box} key={idOf(x)} onPress={()=>navigation.navigate("VendorBookingDetail",{bookingId:idOf(x)})}><View style={s.rowBetween}><Text style={s.boxTitle}>{x?.bookingNumber??"Booking"}</Text><Text style={s.status}>{String(x?.status??"").toUpperCase()}</Text></View><Text style={s.copy}>{titleOf(x)}</Text><Text style={s.price}>{money(x?.totalAmount??x?.amount)}</Text></Pressable>)}</ScrollView>;
}
function BookingDetail({route,navigation}:any){
 const id=route.params.bookingId;
 const q=useLoad(async()=>unwrap(await endpoints.booking(id)),[id]);
 const x:any=q.data;
 const allowed=useMemo(()=>{const st=String(x?.status??"");if(st==="pending")return[{label:"Accept booking",status:"accepted"},{label:"Reject booking",status:"rejected"}];if(st==="accepted")return[{label:"Start service",status:"in_progress"}];if(st==="in_progress")return[{label:"Complete service",status:"completed"}];return[]},[x?.status]);
 const act=async(status:string)=>{try{await endpoints.updateBookingStatus(id,status);await q.load()}catch(e){Alert.alert("Booking not updated",errMsg(e))}};
 if(q.busy&&!q.data)return <View style={s.center}><ActivityIndicator color={C.gold}/></View>;
 if(q.error&&!q.data)return <ErrorState message={q.error} retry={q.load}/>;
 return <ScrollView style={s.page} contentContainerStyle={s.content}><Header title="Booking details" onBack={navigation.goBack}/><Box><Text style={s.title}>{x?.bookingNumber??"Booking"}</Text><Text style={s.status}>{String(x?.status??"").toUpperCase()}</Text><Text style={s.copy}>{titleOf(x)}</Text><Text style={s.copy}>{x?.customerId?.firstName||x?.customer?.firstName?`Customer: ${x?.customerId?.firstName??x?.customer?.firstName}`:"Customer booking"}</Text><Text style={s.price}>{money(x?.totalAmount??x?.amount)}</Text></Box>{allowed.map(a=><Pressable key={a.status} style={a.status==="rejected"?s.dangerButton:s.primary} onPress={()=>act(a.status)}><Text style={a.status==="rejected"?s.dangerText:s.primaryText}>{a.label}</Text></Pressable>)}</ScrollView>;
}

function Earnings(){
 const q=useLoad(async()=>{const[p,o,r]=await Promise.all([endpoints.payments(),endpoints.vendorOverview(),endpoints.vendorRevenueChart()]);return{payments:listOf(p),overview:unwrap(o),chart:unwrap(r)}},[]);
 if(q.busy&&!q.data)return <View style={s.center}><ActivityIndicator color={C.gold}/></View>;
 if(q.error&&!q.data)return <ErrorState message={q.error} retry={q.load}/>;
 const d:any=q.data??{}, nums=Object.entries(d.overview??{}).filter(([k,v])=>typeof v==="number"&&/earn|revenue|payout|amount/i.test(k));
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={q.busy} onRefresh={q.load} tintColor={C.gold}/>}><Header title="Earnings"/><View style={s.metricGrid}>{nums.slice(0,4).map(([k,v])=><View style={s.metric} key={k}><Text style={s.metricValue}>{money(v)}</Text><Text style={s.metricLabel}>{k.replace(/([A-Z])/g," $1")}</Text></View>)}</View><Text style={s.section}>PAYMENT HISTORY</Text>{!d.payments?.length?<Empty title="No payment history" copy="Completed payment activity will appear from the live payments API."/>:d.payments.map((x:any)=><Box key={idOf(x)}><View style={s.rowBetween}><Text style={s.boxTitle}>{x?.paymentId??x?.razorpayPaymentId??"Payment"}</Text><Text style={s.status}>{String(x?.status??"").toUpperCase()}</Text></View><Text style={s.price}>{money(x?.amount)}</Text><Text style={s.copy}>{x?.createdAt?new Date(x.createdAt).toLocaleString("en-IN"):""}</Text></Box>)}</ScrollView>;
}

function Reviews(){
 const user=useSession(x=>x.user);
 const q=useLoad(async()=>listOf(await endpoints.vendorReviews(String(user?._id??""))),[user?._id]);
 const reply=async(id:string,current?:string)=>{let text=current??"";Alert.prompt?.("Reply to review","Enter a professional public reply",async value=>{text=value??"";if(text.trim().length<2)return;try{await endpoints.replyReview(id,text.trim());await q.load()}catch(e){Alert.alert("Reply not saved",errMsg(e))}},"plain-text",text)};
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={q.busy} onRefresh={q.load} tintColor={C.gold}/>}><Header title="Reviews"/>{q.error?<Text style={s.error}>{q.error}</Text>:null}{!q.busy&&!q.data?.length?<Empty title="No reviews yet" copy="Verified customer reviews will appear here."/>:null}{(q.data??[]).map((x:any)=><Box key={idOf(x)}><View style={s.rowBetween}><Text style={s.boxTitle}>{x?.customerId?.firstName??"Customer"}</Text><Text style={s.rating}><Star size={14} color={C.goldLight}/> {x?.rating??0}</Text></View><Text style={s.copy}>{x?.comment??x?.review??""}</Text>{x?.vendorReply?<Text style={s.reply}>Your reply: {x.vendorReply}</Text>:<ReplyComposer reviewId={idOf(x)} done={q.load}/>}</Box>)}</ScrollView>;
}
function ReplyComposer({reviewId,done}:{reviewId:string;done:()=>Promise<void>}){const[text,setText]=useState(""),[busy,setBusy]=useState(false);const submit=async()=>{if(text.trim().length<2)return Alert.alert("Reply required","Enter a reply before submitting.");setBusy(true);try{await endpoints.replyReview(reviewId,text.trim());setText("");await done()}catch(e){Alert.alert("Reply not saved",errMsg(e))}finally{setBusy(false)}};return <View><TextInput style={s.field} placeholder="Write a public reply" placeholderTextColor={C.mutedSoft} value={text} onChangeText={setText}/><Pressable style={s.smallButton} onPress={submit} disabled={busy}><Text style={s.smallButtonText}>{busy?"Saving...":"Reply"}</Text></Pressable></View>}

function VendorAccount({root}:any){
 const user=useSession(x=>x.user),refreshUser=useSession(x=>x.refreshUser);
 const q=useLoad(async()=>{const[a,r]=await Promise.all([endpoints.vendorApplication().catch(()=>null),endpoints.vendorReadiness().catch(()=>null)]);return{application:a?unwrap(a):null,readiness:r?unwrap(r):null}},[]);
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={q.busy} onRefresh={q.load} tintColor={C.gold}/>}><Header title="Vendor account"/><Box><UserRound size={25} color={C.goldLight}/><Text style={s.title}>{[user?.firstName,user?.lastName].filter(Boolean).join(" ")||"OMIQORA Vendor"}</Text><Text style={s.copy}>{user?.email}</Text><Text style={s.status}>{String(q.data?.application?.status??(user?.isVendorApproved?"approved":"vendor")).toUpperCase()}</Text></Box><Text style={s.section}>BUSINESS & VERIFICATION</Text><Action title="Vendor verification" copy="Business, KYC, bank, address, location, portfolio and work-proof onboarding." icon={<BookOpen size={20} color={C.goldLight}/>} onPress={root.verification}/><Action title="Messages" copy="Open customer conversations." icon={<MessageCircle size={20} color={C.goldLight}/>} onPress={root.messages}/><Action title="Notifications" copy="Open vendor and booking updates." icon={<Bell size={20} color={C.goldLight}/>} onPress={root.notifications}/><Action title="Customer space" copy="Return to the customer marketplace without signing out." icon={<UserRound size={20} color={C.goldLight}/>} onPress={root.customer}/><Pressable style={s.secondary} onPress={async()=>{await refreshUser();await q.load()}}><Text style={s.secondaryText}>Refresh vendor access</Text></Pressable></ScrollView>;
}

export function VendorWorkspaceScreen({onBack,onMessages,onNotifications,onVerification}:{onBack:()=>void;onMessages:()=>void;onNotifications:()=>void;onVerification:()=>void}){
 const root={messages:onMessages,notifications:onNotifications,verification:onVerification,customer:onBack};
 return <Tabs.Navigator initialRouteName="VendorHome" screenOptions={({route}:any)=>({headerShown:false,tabBarHideOnKeyboard:true,tabBarActiveTintColor:C.goldLight,tabBarInactiveTintColor:C.muted,tabBarStyle:{backgroundColor:C.royalNavy,borderTopColor:C.border,height:68,paddingTop:7,paddingBottom:8},tabBarLabelStyle:{fontSize:10,fontWeight:"800"},tabBarIcon:({color,size}:any)=>{const I=route.name==="VendorHome"?BarChart3:route.name==="Services"?Store:route.name==="Bookings"?CalendarDays:route.name==="Earnings"?CircleDollarSign:Settings;return <I size={size} color={color}/>}})}>
  <Tabs.Screen name="VendorHome" options={{title:"Dashboard"}}>{(p:any)=><Dashboard {...p} root={root}/>}</Tabs.Screen>
  <Tabs.Screen name="Services" component={Services} options={{title:"Services"}}/>
  <Tabs.Screen name="Bookings" component={Bookings} options={{title:"Bookings"}}/>
  <Tabs.Screen name="Earnings" component={Earnings} options={{title:"Earnings"}}/>
  <Tabs.Screen name="VendorAccount" options={{title:"Account"}}>{(p:any)=><VendorAccount {...p} root={root}/>}</Tabs.Screen>
 </Tabs.Navigator>;
}
export const VendorServiceEditorScreen=ServiceEditor;
export const VendorServiceDetailScreen=ServiceDetail;
export const VendorBookingDetailScreen=BookingDetail;
export const VendorReviewsScreen=Reviews;

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.midnight},content:{padding:18,paddingTop:22,paddingBottom:38},center:{flex:1,backgroundColor:C.midnight,alignItems:"center",justifyContent:"center",padding:24},brandRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18},eyebrow:{color:C.gold,fontSize:9,fontWeight:"900",letterSpacing:2},title:{color:C.white,fontSize:24,fontWeight:"900",marginTop:5},copy:{color:C.muted,fontSize:12,lineHeight:19,marginTop:7},header:{height:52,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},headerTitle:{color:C.white,fontSize:20,fontWeight:"900"},icon:{width:42,height:42,alignItems:"center",justifyContent:"center"},section:{color:C.gold,fontSize:9,fontWeight:"900",letterSpacing:1.6,marginTop:22,marginBottom:9},box:{borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,padding:16,marginBottom:11},boxTitle:{color:C.white,fontSize:15,fontWeight:"900"},action:{minHeight:82,borderRadius:19,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,padding:15,marginBottom:10,flexDirection:"row",alignItems:"center",gap:12},actionText:{flex:1},rowBetween:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},metricGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},metric:{width:"48%",minHeight:96,borderRadius:19,borderWidth:1,borderColor:C.border,backgroundColor:C.elevatedNavy,padding:15,justifyContent:"center"},metricValue:{color:C.white,fontSize:21,fontWeight:"900"},metricLabel:{color:C.muted,fontSize:10,marginTop:5,textTransform:"capitalize"},status:{color:C.goldLight,fontSize:9,fontWeight:"900",letterSpacing:1},price:{color:C.goldLight,fontSize:17,fontWeight:"900",marginTop:12},primary:{minHeight:52,borderRadius:16,backgroundColor:C.gold,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8,marginTop:12,paddingHorizontal:16},primaryText:{color:C.midnight,fontWeight:"900"},secondary:{minHeight:50,borderRadius:16,borderWidth:1,borderColor:C.borderStrong,alignItems:"center",justifyContent:"center",marginTop:12},secondaryText:{color:C.goldLight,fontWeight:"900"},dangerButton:{minHeight:50,borderRadius:16,borderWidth:1,borderColor:C.dangerBorder,alignItems:"center",justifyContent:"center",marginTop:12},dangerText:{color:C.danger,fontWeight:"900"},error:{color:C.danger,textAlign:"center",lineHeight:20,marginBottom:12},field:{minHeight:54,borderRadius:16,borderWidth:1,borderColor:C.border,backgroundColor:C.input,color:C.white,paddingHorizontal:15,marginTop:11},multiline:{minHeight:120,textAlignVertical:"top",paddingTop:15},label:{color:C.gold,fontSize:9,fontWeight:"900",letterSpacing:1.4,marginTop:18,marginBottom:8},chips:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{borderRadius:999,borderWidth:1,borderColor:C.border,paddingHorizontal:13,paddingVertical:10},chipOn:{borderColor:C.goldLight,backgroundColor:C.deepNavy},chipText:{color:C.white,fontSize:11,fontWeight:"700"},rating:{color:C.goldLight,fontWeight:"900",flexDirection:"row"},reply:{color:C.goldLight,fontSize:12,lineHeight:19,marginTop:10},smallButton:{alignSelf:"flex-end",borderRadius:12,backgroundColor:C.gold,paddingHorizontal:18,paddingVertical:10,marginTop:8},smallButtonText:{color:C.midnight,fontWeight:"900"}
});
