import React,{useState} from "react";
import {Pressable,ScrollView,StyleSheet,Text,View} from "react-native";
import {Image} from "expo-image";
import {LinearGradient} from "expo-linear-gradient";
import {Bot,CalendarDays,Compass,Home,Search,ShieldCheck,Sparkles,UserRound} from "lucide-react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useSession} from "../stores/session";
import {OMIQORA} from "../theme";
import {DiscoveryScreen} from "./DiscoveryScreen";
import {ServiceDetailScreen} from "./ServiceDetailScreen";
import {BookingCreateScreen} from "./BookingCreateScreen";
import {BookingsScreen} from "./BookingsScreen";
import {BookingDetailScreen} from "./BookingDetailScreen";
import {PaymentsScreen} from "./PaymentsScreen";
import {OmiScreen} from "./OmiScreen";
import {NotificationsScreen} from "./NotificationsScreen";
import {ConversationsScreen} from "./ConversationsScreen";
import {ChatScreen} from "./ChatScreen";
import {AccountScreen} from "./AccountScreen";
import {VendorScreen} from "./VendorScreen";
import {SavedScreen} from "./SavedScreen";
import {ReviewScreen} from "./ReviewScreen";
import {AdminScreen} from "./AdminScreen";
import {BudgetPlannerScreen} from "./BudgetPlannerScreen";
import {OperationsScreen} from "./OperationsScreen";
const C=OMIQORA.colors;
type Tab="Home"|"Explore"|"OMI"|"Bookings"|"Account"|"Admin"|"Vendor";
type Overlay={type:"service";serviceId:string}|{type:"booking-create";service:any}|{type:"booking-detail";bookingId:string}|{type:"payments"}|{type:"notifications"}|{type:"conversations"}|{type:"chat";conversationId:string}|{type:"vendor"}|{type:"saved"}|{type:"review";bookingId:string}|{type:"budget"}|{type:"operations";mode:"admin"|"vendor"|"customer"}|null;
export function MainShell(){
 const [tab,setTab]=useState<Tab>("Home"),[overlay,setOverlay]=useState<Overlay>(null),[homeSearch,setHomeSearch]=useState("");const user=useSession(x=>x.user);
 const role=String(user?.role??"customer").toLowerCase();
 const tabs:any[]=role==="admin"
   ? [["Home",Home],["Admin",ShieldCheck],["OMI",Bot],["Account",UserRound]]
   : role==="vendor"
     ? [["Home",Home],["Vendor",ShieldCheck],["Bookings",CalendarDays],["OMI",Bot],["Account",UserRound]]
     : [["Home",Home],["Explore",Compass],["OMI",Bot],["Bookings",CalendarDays],["Account",UserRound]];
 const openExplore=(query="")=>{setHomeSearch(query);setOverlay(null);setTab("Explore")};const openService=(serviceId:string)=>setOverlay({type:"service",serviceId});const openBooking=(bookingId:string)=>setOverlay({type:"booking-detail",bookingId});
 if(overlay?.type==="service")return <Shell><ServiceDetailScreen serviceId={overlay.serviceId} onBack={()=>setOverlay(null)} onBook={(service:any)=>setOverlay({type:"booking-create",service})}/></Shell>;
 if(overlay?.type==="booking-create")return <Shell><BookingCreateScreen service={overlay.service} onBack={()=>setOverlay({type:"service",serviceId:String(overlay.service?._id??overlay.service?.id??"")})} onCreated={openBooking}/></Shell>;
 if(overlay?.type==="booking-detail")return <Shell><BookingDetailScreen bookingId={overlay.bookingId} onBack={()=>{setOverlay(null);setTab("Bookings")}} onPayments={()=>setOverlay({type:"payments"})} onReview={bookingId=>setOverlay({type:"review",bookingId})}/></Shell>;
 if(overlay?.type==="payments")return <Shell><PaymentsScreen onBack={()=>{setOverlay(null);setTab("Bookings")}}/></Shell>;
 if(overlay?.type==="notifications")return <Shell><NotificationsScreen onBack={()=>setOverlay(null)}/></Shell>;
 if(overlay?.type==="conversations")return <Shell><ConversationsScreen onBack={()=>setOverlay(null)} onOpen={id=>setOverlay({type:"chat",conversationId:id})}/></Shell>;
 if(overlay?.type==="chat")return <Shell><ChatScreen conversationId={overlay.conversationId} onBack={()=>setOverlay({type:"conversations"})}/></Shell>;
 if(overlay?.type==="vendor")return <Shell><VendorScreen onBack={()=>setOverlay(null)}/></Shell>;
 if(overlay?.type==="saved")return <Shell><SavedScreen onBack={()=>setOverlay(null)} onOpen={openService}/></Shell>;
 if(overlay?.type==="review")return <Shell><ReviewScreen bookingId={overlay.bookingId} onBack={()=>setOverlay({type:"booking-detail",bookingId:overlay.bookingId})} onDone={()=>setOverlay({type:"booking-detail",bookingId:overlay.bookingId})}/></Shell>;
 if(overlay?.type==="budget")return <Shell><BudgetPlannerScreen onBack={()=>setOverlay(null)}/></Shell>;
 if(overlay?.type==="operations")return <Shell><OperationsScreen mode={overlay.mode} onOpenBooking={openBooking} onOpenService={openService} onMessages={()=>setOverlay({type:"conversations"})}/></Shell>;
 const home=<ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}><View style={s.top}><View><Text style={s.eye}>OMIQORA</Text><Text style={s.head}>Hello{user?.firstName?`, ${user.firstName}`:""}</Text></View><Image source={require("../../assets/omiqora-icon.png")} style={s.logo} contentFit="contain"/></View><Text style={s.lead}>What can we make possible for you today?</Text><Pressable style={s.search} onPress={()=>openExplore()}><Search size={19} color={C.muted}/><Text style={s.searchText}>Search services, experts, experiences...</Text></Pressable><LinearGradient colors={[C.royalNavy,C.elevatedNavy,C.royalNavy]} style={s.hero}><Sparkles size={25} color={C.goldLight}/><Text style={s.heroTitle}>One platform. Infinite possibilities.</Text><Text style={s.heroText}>Discover trusted services across a growing ecosystem, intelligently brought together for you.</Text><Pressable style={s.heroButton} onPress={()=>openExplore()}><Text style={s.heroButtonText}>Explore OMIQORA</Text></Pressable></LinearGradient><Text style={s.sectionEye}>YOUR OMIQORA</Text><Text style={s.sectionTitle}>Everything begins here</Text><View style={s.grid}>{(role==="admin"?[["Admin","Platform operations"],["Ask OMI","Use ecosystem intelligence"],["Messages","Stay connected"],["Account","Manage account"]]:role==="vendor"?[["Vendor","Vendor workspace"],["Bookings","Manage service journeys"],["Messages","Stay connected"],["AI Budget","Open budget planner"]]:[["Discover","Explore live services"],["Ask OMI","Use ecosystem intelligence"],["Bookings","Manage your journeys"],["AI Budget","Plan an event budget"],["Messages","Stay connected"]]).map(([title,copy])=><Pressable key={title} style={s.card} onPress={()=>title==="Admin"?setTab("Admin"):title==="Vendor"?setTab("Vendor"):title==="Ask OMI"?setTab("OMI"):title==="Bookings"?setTab("Bookings"):title==="Messages"?setOverlay({type:"conversations"}):title==="AI Budget"?setOverlay({type:"budget"}):title==="Account"?setTab("Account"):openExplore()}><Text style={s.cardTitle}>{title}</Text><Text style={s.cardCopy}>{copy}</Text><Text style={s.spark}>✦</Text></Pressable>)}</View></ScrollView>;
 return <SafeAreaView style={s.safe} edges={["top","bottom"]}><View style={{flex:1}}><View style={{flex:1}}>{tab==="Home"?home:tab==="Admin"?<OperationsScreen mode="admin" onOpenBooking={openBooking} onOpenService={openService} onMessages={()=>setOverlay({type:"conversations"})}/>:tab==="Vendor"?<OperationsScreen mode="vendor" onOpenBooking={openBooking} onOpenService={openService} onMessages={()=>setOverlay({type:"conversations"})}/>:tab==="Explore"?<DiscoveryScreen key={homeSearch} initialQuery={homeSearch} onOpenService={openService}/>:tab==="OMI"?<OmiScreen/>:tab==="Bookings"?<BookingsScreen onOpen={openBooking}/>:<AccountScreen onNotifications={()=>setOverlay({type:"notifications"})} onMessages={()=>setOverlay({type:"conversations"})} onVendor={()=>setOverlay({type:"vendor"})} onSaved={()=>setOverlay({type:"saved"})} onPayments={()=>setOverlay({type:"payments"})} onAdmin={()=>setTab("Admin")} onOperations={()=>setOverlay({type:"operations",mode:"customer"})}/>}</View><View style={s.tabBar}>{tabs.map(([name,Icon])=>{const active=tab===name;return <Pressable key={name} style={s.tab} onPress={()=>{setOverlay(null);setTab(name)}}><Icon size={19} color={active?C.gold:C.muted}/><Text style={[s.tabText,active&&{color:C.gold}]}>{name}</Text>{active?<View style={s.dot}/>:null}</Pressable>})}</View></View></SafeAreaView>
}
function Shell({children}:{children:React.ReactNode}){return <SafeAreaView style={s.safe} edges={["top","bottom"]}>{children}</SafeAreaView>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.midnight},screen:{paddingHorizontal:19,paddingTop:18,paddingBottom:35},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},eye:{color:C.gold,fontSize:9,fontWeight:"900",letterSpacing:2},head:{color:C.white,fontSize:25,fontWeight:"900",marginTop:5},logo:{width:48,height:48,borderRadius:16},lead:{color:C.muted,fontSize:13,marginTop:8},search:{minHeight:54,borderRadius:17,borderWidth:1,borderColor:C.border,backgroundColor:C.elevatedNavy,flexDirection:"row",alignItems:"center",paddingHorizontal:15,marginTop:20},searchText:{color:C.muted,fontSize:11,marginLeft:10},hero:{borderRadius:26,borderWidth:1,borderColor:C.borderStrong,padding:21,marginTop:17},heroTitle:{color:C.white,fontSize:21,lineHeight:27,fontWeight:"900",marginTop:17,maxWidth:250},heroText:{color:C.muted,fontSize:11,lineHeight:18,marginTop:8},heroButton:{alignSelf:"flex-start",height:42,borderRadius:14,backgroundColor:C.gold,paddingHorizontal:16,alignItems:"center",justifyContent:"center",marginTop:17},heroButtonText:{color:C.midnight,fontSize:11,fontWeight:"900"},sectionEye:{color:C.gold,fontSize:8,fontWeight:"900",letterSpacing:1.5,marginTop:27},sectionTitle:{color:C.white,fontSize:18,fontWeight:"900",marginTop:4,marginBottom:14},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},card:{width:"48%",minHeight:112,borderRadius:20,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,padding:15,position:"relative"},cardTitle:{color:C.white,fontSize:14,fontWeight:"900"},cardCopy:{color:C.muted,fontSize:9,lineHeight:15,marginTop:7,paddingRight:12},spark:{position:"absolute",right:12,bottom:10,color:C.gold,fontSize:13},tabBar:{height:69,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.royalNavy,flexDirection:"row",alignItems:"center",justifyContent:"space-around",paddingHorizontal:4},tab:{minWidth:57,alignItems:"center",justifyContent:"center",gap:4,position:"relative"},tabText:{color:C.muted,fontSize:8,fontWeight:"800"},dot:{position:"absolute",bottom:-8,width:4,height:4,borderRadius:2,backgroundColor:C.gold}});
