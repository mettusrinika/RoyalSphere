import React from "react";
import {Pressable,ScrollView,StyleSheet,Text,View} from "react-native";
import {Image} from "expo-image";
import {LinearGradient} from "expo-linear-gradient";
import {NavigationContainer,DarkTheme} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {Bot,CalendarDays,Compass,Home,Search,UserRound} from "lucide-react-native";
import {useSession} from "../stores/session";
import {OMIQORA} from "../theme";
import {DiscoveryScreen} from "./DiscoveryScreen";
import {ServiceDetailScreen} from "./ServiceDetailScreen";
import {BookingCreateScreen} from "./BookingCreateScreen";
import {BookingsScreen} from "./BookingsScreen";
import {BookingDetailScreen} from "./BookingDetailScreen";
import {PaymentsScreen} from "./PaymentsScreen";
import {PaymentDetailScreen} from "./PaymentDetailScreen";
import {OmiScreen} from "./OmiScreen";
import {NotificationsScreen} from "./NotificationsScreen";
import {ConversationsScreen} from "./ConversationsScreen";
import {ChatScreen} from "./ChatScreen";
import {AccountScreen} from "./AccountScreen";
import {VendorScreen} from "./VendorScreen";
import {VendorWorkspaceScreen,VendorServiceEditorScreen,VendorServiceDetailScreen,VendorBookingDetailScreen,VendorReviewsScreen} from "./VendorWorkspaceScreen";
import {SavedScreen} from "./SavedScreen";
import {ReviewScreen} from "./ReviewScreen";
import {BudgetPlannerScreen} from "./BudgetPlannerScreen";
import {OperationsScreen} from "./OperationsScreen";
import {AdminWorkspaceScreen} from "./AdminWorkspaceScreen";

const C=OMIQORA.colors;
const Stack=createNativeStackNavigator<any>();
const Tabs=createBottomTabNavigator<any>();
const navTheme={...DarkTheme,colors:{...DarkTheme.colors,primary:C.gold,background:C.midnight,card:C.royalNavy,text:C.white,border:C.border,notification:C.gold}};

function HomeScreen({navigation}:any){
 const user=useSession(x=>x.user);
 return <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
  <View style={s.top}><View><Text style={s.eye}>OMIQORA</Text><Text style={s.title}>Hello{user?.firstName?`, ${user.firstName}`:""}</Text></View><Image source={require("../../assets/omiqora-icon.png")} style={s.logo} contentFit="contain"/></View>
  <Text style={s.lead}>What can we make possible for you today?</Text>
  <Pressable style={s.search} onPress={()=>navigation.navigate("ExploreTab")}><Search size={19} color={C.muted}/><Text style={s.searchText}>Search services, experts, experiences...</Text></Pressable>
  <LinearGradient colors={[C.royalNavy,C.elevatedNavy,C.royalNavy]} style={s.hero}><Text style={s.heroTitle}>One platform. Infinite possibilities.</Text><Text style={s.heroText}>Discover trusted services and manage every service journey from one place.</Text><Pressable style={s.primary} onPress={()=>navigation.navigate("ExploreTab")}><Text style={s.primaryText}>Explore services</Text></Pressable></LinearGradient>
  <Text style={s.section}>QUICK ACTIONS</Text>
  <View style={s.grid}>
   <Quick title="Messages" copy="Open your service conversations" onPress={()=>navigation.navigate("Conversations")}/>
   <Quick title="AI Budget" copy="Plan with live OMIQORA intelligence" onPress={()=>navigation.navigate("Budget")}/>
   <Quick title="Saved" copy="Return to services you saved" onPress={()=>navigation.navigate("Saved")}/>
   <Quick title="Notifications" copy="See account and journey updates" onPress={()=>navigation.navigate("Notifications")}/>
  </View>
 </ScrollView>;
}
function Quick({title,copy,onPress}:{title:string;copy:string;onPress:()=>void}){return <Pressable style={s.card} onPress={onPress}><Text style={s.cardTitle}>{title}</Text><Text style={s.cardCopy}>{copy}</Text><Text style={s.arrow}>›</Text></Pressable>}
function ExploreTab({navigation}:any){return <DiscoveryScreen onOpenService={(serviceId)=>navigation.navigate("ServiceDetail",{serviceId})}/>}
function BookingsTab({navigation}:any){return <BookingsScreen onOpen={(bookingId)=>navigation.navigate("BookingDetail",{bookingId})}/>}
function AccountTab({navigation}:any){return <AccountScreen onNotifications={()=>navigation.navigate("Notifications")} onMessages={()=>navigation.navigate("Conversations")} onVendor={()=>navigation.navigate("VendorAccess")} onSaved={()=>navigation.navigate("Saved")} onPayments={()=>navigation.navigate("Payments")} onAdmin={()=>navigation.navigate("AdminAccess")} onOperations={()=>navigation.navigate("CustomerActivity")}/>}
function CustomerTabs(){return <Tabs.Navigator initialRouteName="HomeTab" screenOptions={({route}:any)=>({headerShown:false,tabBarHideOnKeyboard:true,tabBarActiveTintColor:C.goldLight,tabBarInactiveTintColor:C.muted,tabBarStyle:{backgroundColor:C.royalNavy,borderTopColor:C.border,height:68,paddingTop:7,paddingBottom:8},tabBarLabelStyle:{fontSize:10,fontWeight:"800"},tabBarIcon:({color,size}:any)=>{const I=route.name==="HomeTab"?Home:route.name==="ExploreTab"?Compass:route.name==="OMITab"?Bot:route.name==="BookingsTab"?CalendarDays:UserRound;return <I size={size} color={color}/>}})}>
 <Tabs.Screen name="HomeTab" component={HomeScreen} options={{title:"Home"}}/><Tabs.Screen name="ExploreTab" component={ExploreTab} options={{title:"Explore"}}/><Tabs.Screen name="OMITab" component={OmiScreen} options={{title:"OMI"}}/><Tabs.Screen name="BookingsTab" component={BookingsTab} options={{title:"Bookings"}}/><Tabs.Screen name="AccountTab" component={AccountTab} options={{title:"Account"}}/>
 </Tabs.Navigator>}
export function MainShell(){return <NavigationContainer theme={navTheme}><Stack.Navigator screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.midnight},animation:"slide_from_right"}}><Stack.Screen name="CustomerTabs" component={CustomerTabs}/><Stack.Screen name="ServiceDetail">{({route,navigation}:any)=><ServiceDetailScreen serviceId={route.params.serviceId} onBack={navigation.goBack} onBook={(service)=>navigation.navigate("BookingCreate",{service})}/>}</Stack.Screen><Stack.Screen name="BookingCreate">{({route,navigation}:any)=><BookingCreateScreen service={route.params.service} onBack={navigation.goBack} onCreated={(bookingId)=>navigation.replace("BookingDetail",{bookingId})}/>}</Stack.Screen><Stack.Screen name="BookingDetail">{({route,navigation}:any)=><BookingDetailScreen bookingId={route.params.bookingId} onBack={navigation.goBack} onPayments={()=>navigation.navigate("Payments")} onReview={(bookingId)=>navigation.navigate("Review",{bookingId})} onChat={(conversationId)=>navigation.navigate("Chat",{conversationId})}/>}</Stack.Screen><Stack.Screen name="Payments">{({navigation}:any)=><PaymentsScreen onBack={navigation.goBack} onOpen={(paymentId)=>navigation.navigate("PaymentDetail",{paymentId})}/>}</Stack.Screen><Stack.Screen name="PaymentDetail">{({route,navigation}:any)=><PaymentDetailScreen paymentId={route.params.paymentId} onBack={navigation.goBack}/>}</Stack.Screen><Stack.Screen name="Notifications">{({navigation}:any)=><NotificationsScreen onBack={navigation.goBack}/>}</Stack.Screen><Stack.Screen name="Conversations">{({navigation}:any)=><ConversationsScreen onBack={navigation.goBack} onOpen={(conversationId)=>navigation.navigate("Chat",{conversationId})}/>}</Stack.Screen><Stack.Screen name="Chat">{({route,navigation}:any)=><ChatScreen conversationId={route.params.conversationId} onBack={navigation.goBack}/>}</Stack.Screen><Stack.Screen name="Saved">{({navigation}:any)=><SavedScreen onBack={navigation.goBack} onOpen={(serviceId)=>navigation.navigate("ServiceDetail",{serviceId})}/>}</Stack.Screen><Stack.Screen name="Review">{({route,navigation}:any)=><ReviewScreen bookingId={route.params.bookingId} onBack={navigation.goBack} onDone={navigation.goBack}/>}</Stack.Screen><Stack.Screen name="Budget">{({navigation}:any)=><BudgetPlannerScreen onBack={navigation.goBack}/>}</Stack.Screen><Stack.Screen name="VendorAccess">{({navigation}:any)=><VendorWorkspaceScreen onBack={navigation.goBack} onMessages={()=>navigation.navigate("Conversations")} onNotifications={()=>navigation.navigate("Notifications")} onVerification={()=>navigation.navigate("VendorVerification")}/>}</Stack.Screen><Stack.Screen name="VendorVerification">{({navigation}:any)=><VendorScreen onBack={navigation.goBack}/>}</Stack.Screen><Stack.Screen name="ServiceEditor" component={VendorServiceEditorScreen}/><Stack.Screen name="VendorServiceDetail" component={VendorServiceDetailScreen}/><Stack.Screen name="VendorBookingDetail" component={VendorBookingDetailScreen}/><Stack.Screen name="VendorReviews" component={VendorReviewsScreen}/><Stack.Screen name="AdminAccess">{({navigation}:any)=><AdminWorkspaceScreen onCustomer={()=>navigation.navigate("CustomerTabs")} onMessages={()=>navigation.navigate("Conversations")} onNotifications={()=>navigation.navigate("Notifications")}/>}</Stack.Screen><Stack.Screen name="CustomerActivity">{({navigation}:any)=><OperationsScreen mode="customer" onOpenBooking={(bookingId)=>navigation.navigate("BookingDetail",{bookingId})} onOpenService={(serviceId)=>navigation.navigate("ServiceDetail",{serviceId})} onMessages={()=>navigation.navigate("Conversations")}/>}</Stack.Screen></Stack.Navigator></NavigationContainer>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.midnight},content:{padding:20,paddingTop:24,paddingBottom:35},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},eye:{color:C.gold,fontSize:9,fontWeight:"900",letterSpacing:2},title:{color:C.white,fontSize:27,fontWeight:"900",marginTop:5},logo:{width:48,height:48},lead:{color:C.muted,fontSize:14,lineHeight:21,marginTop:12},search:{height:56,borderRadius:18,borderWidth:1,borderColor:C.border,backgroundColor:C.input,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:16,marginTop:20},searchText:{color:C.muted,flex:1,fontSize:12},hero:{borderRadius:25,padding:22,marginTop:18,borderWidth:1,borderColor:C.borderStrong},heroTitle:{color:C.white,fontSize:23,fontWeight:"900",lineHeight:29},heroText:{color:C.muted,lineHeight:21,marginTop:9},primary:{height:50,borderRadius:16,backgroundColor:C.gold,alignItems:"center",justifyContent:"center",marginTop:18},primaryText:{color:C.midnight,fontWeight:"900"},section:{color:C.gold,fontSize:9,fontWeight:"900",letterSpacing:1.6,marginTop:25,marginBottom:10},grid:{gap:10},card:{minHeight:86,borderRadius:19,borderWidth:1,borderColor:C.border,backgroundColor:C.royalNavy,padding:16,justifyContent:"center"},cardTitle:{color:C.white,fontSize:15,fontWeight:"900"},cardCopy:{color:C.muted,fontSize:11,marginTop:5,paddingRight:25},arrow:{position:"absolute",right:17,color:C.goldLight,fontSize:28}});
