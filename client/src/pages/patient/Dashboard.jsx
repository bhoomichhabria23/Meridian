// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Activity,
//   AlertTriangle,
//   Bell,
//   CalendarDays,
//   ChevronDown,
//   ChevronRight,
//   ClipboardList,
//   Clock3,
//   Download,
//   FileBarChart,
//   FileImage,
//   FileText,
//   Heart,
//   HelpCircle,
//   LayoutDashboard,
//   Leaf,
//   LineChart,
//   LogOut,
//   Pill,
//   Share2,
//   ShieldCheck,
//   TestTube2,
//   Upload,
//   UserRound,
// } from "lucide-react";

// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";

// import { signOut, onAuthStateChanged } from "firebase/auth";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   where,
// } from "firebase/firestore";

// import { auth, db } from "../../firebase";


// /* ============================================================
//    DEFAULT EMPTY DATA
//   ["Appointments", CalendarDays],
//   ["Reminders", Bell],
// ];


// /* ============================================================
//    DASHBOARD
// ============================================================ */

// export default function Dashboard() {

//   const [patient, setPatient] = useState(emptyPatient);

//   const [medications, setMedications] = useState([]);
//   const [conditions, setConditions] = useState([]);
//   const [labs, setLabs] = useState([]);
//   const [reports, setReports] = useState([]);
//   const [appointments, setAppointments] = useState([]);
//   const [alerts, setAlerts] = useState([]);

//   const [loading, setLoading] = useState(true);


//   /* ==========================================================
//      LOAD LOGGED-IN PATIENT
//   ========================================================== */

//   useEffect(() => {

//     let unsubscribe;

//     const loadPatientData = async (user) => {

//       if (!user) {
//         setLoading(false);
//         return;
//       }

//       try {

//         /* ------------------------------------------------------
//            PATIENT PROFILE
//         ------------------------------------------------------ */

//         const patientRef = doc(db, "patients", user.uid);

//         const patientSnap = await getDoc(patientRef);

//         if (patientSnap.exists()) {

//           const data = patientSnap.data();

//           setPatient({
//             name:
//               data.name ||
//               data.fullName ||
//               user.displayName ||
//               "Patient",

//             patientId:
//               data.patientId ||
//               data.mrdId ||
//               "—",

//             age:
//               data.age ||
//               "—",

//             gender:
//               data.gender ||
//               "—",

//             bloodGroup:
//               data.bloodGroup ||
//               "—",

//             phone:
//               data.phone ||
//               user.phoneNumber ||
//               "—",

//             height:
//               data.height ||
//               "",

//             weight:
//               data.weight ||
//               "",
//           });

//         } else {

//           /* If profile doesn't exist yet */

//           setPatient({
//             ...emptyPatient,
//             name: user.displayName || "Patient",
//             phone: user.phoneNumber || "—",
//           });

//         }


//         /* ------------------------------------------------------
//            CONDITIONS
//         ------------------------------------------------------ */

//         const conditionsQuery = query(
//           collection(db, "conditions"),
//           where("userId", "==", user.uid)
//         );

//         const conditionsSnap = await getDocs(conditionsQuery);

//         const conditionData = conditionsSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         setConditions(conditionData);


//         /* ------------------------------------------------------
//            MEDICATIONS
//         ------------------------------------------------------ */

//         const medicationsQuery = query(
//           collection(db, "medications"),
//           where("userId", "==", user.uid)
//         );

//         const medicationsSnap = await getDocs(medicationsQuery);

//         const medicationData = medicationsSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         setMedications(medicationData);


//         /* ------------------------------------------------------
//            LAB RESULTS
//         ------------------------------------------------------ */

//         const labsQuery = query(
//           collection(db, "labResults"),
//           where("userId", "==", user.uid)
//         );

//         const labsSnap = await getDocs(labsQuery);

//         const labData = labsSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         setLabs(labData);


//         /* ------------------------------------------------------
//            REPORTS
//         ------------------------------------------------------ */

//         const reportsQuery = query(
//           collection(db, "reports"),
//           where("userId", "==", user.uid)
//         );

//         const reportsSnap = await getDocs(reportsQuery);

//         const reportData = reportsSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         setReports(reportData);


//         /* ------------------------------------------------------
//            APPOINTMENTS
//         ------------------------------------------------------ */

//         const appointmentsQuery = query(
//           collection(db, "appointments"),
//           where("userId", "==", user.uid)
//         );

//         const appointmentsSnap =
//           await getDocs(appointmentsQuery);

//         const appointmentData =
//           appointmentsSnap.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           }));

//         setAppointments(appointmentData);


//         /* ------------------------------------------------------
//            ALERTS
//         ------------------------------------------------------ */

//         const alertsQuery = query(
//           collection(db, "alerts"),
//           where("userId", "==", user.uid)
//         );

//         const alertsSnap = await getDocs(alertsQuery);

//         const alertData = alertsSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         setAlerts(alertData);

//       } catch (error) {

//         console.error(
//           "Error loading patient dashboard:",
//           error
//         );

//       } finally {

//         setLoading(false);

//       }
//     };


//     unsubscribe = onAuthStateChanged(
//       auth,
//       (user) => {
//         loadPatientData(user);
//       }
//     );


//     return () => {
//       if (unsubscribe) {
//         unsubscribe();
//       }
//     };

//   }, []);


//   /* ============================================================
//      BMI
//   ============================================================ */

//   const bmi = useMemo(() => {

//     const height = Number(patient.height);
//     const weight = Number(patient.weight);

//     if (!height || !weight) {
//       return null;
//     }

//     const heightMeters = height / 100;

//     return (
//       weight /
//       (heightMeters * heightMeters)
//     ).toFixed(1);

//   }, [patient.height, patient.weight]);


//   const bmiStatus = useMemo(() => {

//     if (!bmi) return "Not available";

//     const value = Number(bmi);

//     if (value < 18.5) return "Underweight";

//     if (value < 25) return "Normal";

//     if (value < 30) return "Overweight";

//     return "Obese";

//   }, [bmi]);


//   /* ============================================================
//      LAB TREND DATA
//   ============================================================ */

//   const labData = useMemo(() => {

//     const hba1cLabs = labs
//       .filter(
//         (lab) =>
//           lab.type === "HbA1c" ||
//           lab.testName === "HbA1c"
//       )
//       .map((lab) => ({
//         month:
//           lab.month ||
//           lab.date ||
//           lab.createdAt ||
//           "—",

//         value:
//           Number(
//             lab.value ||
//             lab.result ||
//             0
//           ),
//       }))
//       .filter((lab) => lab.value > 0);

//     if (hba1cLabs.length > 0) {
//       return hba1cLabs.slice(-6);
//     }

//     return [];

//   }, [labs]);


//   /* ============================================================
//      LATEST HBA1C
//   ============================================================ */

//   const latestHbA1c = useMemo(() => {

//     const hba1c = labs
//       .filter(
//         (lab) =>
//           lab.type === "HbA1c" ||
//           lab.testName === "HbA1c"
//       )
//       .map((lab) => ({
//         value: Number(
//           lab.value ||
//           lab.result ||
//           0
//         ),

//         date:
//           lab.date ||
//           lab.createdAt ||
//           "—",
//       }))
//       .filter((lab) => lab.value > 0);

//     if (!hba1c.length) {
//       return null;
//     }

//     return hba1c[hba1c.length - 1];

//   }, [labs]);


//   /* ============================================================
//      HEALTH SCORE
//   ============================================================ */

//   const healthScore = useMemo(() => {

//     let score = 100;

//     score -= alerts.filter(
//       (alert) => alert.type === "red"
//     ).length * 10;

//     score -= alerts.filter(
//       (alert) => alert.type === "orange"
//     ).length * 5;

//     if (score < 0) score = 0;

//     return score;

//   }, [alerts]);


//   /* ============================================================
//      LOGOUT
//   ============================================================ */

//   const handleLogout = async () => {

//     try {

//       await signOut(auth);

//       window.location.href = "/login";

//     } catch (error) {

//       console.error(
//         "Logout failed:",
//         error
//       );

//     }

//   };


//   /* ============================================================
//      LOADING
//   ============================================================ */

//   if (loading) {

//     return (
//       <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center">

//         <div className="text-center">

//           <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dcefe1] border-t-[#159447]" />

//           <p className="mt-3 text-sm text-gray-500">
//           </p>

//         </div>

//       </div>
//     );

//   }


//   return (

//     <div className="min-h-screen bg-[#f7faf8] text-[#18231d]">


//       {/* =====================================================
//           TOP NAVIGATION
//       ===================================================== */}

//       <header className="sticky top-0 z-50 h-[68px] border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">

//         <div className="mx-auto flex h-full max-w-[1500px] items-center px-6">


//           {/* Logo */}

//           <div className="flex min-w-[205px] items-center gap-2.5">

//             <div className="relative h-9 w-9">

//               <div className="absolute left-3 top-0 h-9 w-3 rounded-full bg-[#16a34a]" />

//               <div className="absolute left-0 top-3 h-3 w-9 rounded-full bg-[#16a34a]" />

//               <div className="absolute left-[6px] top-[6px] h-3 w-3 rounded-full bg-white" />

//             </div>

//             <div>

//               <h1 className="text-[20px] font-bold tracking-wide text-[#14833b]">
//                 MERIDIAN
//               </h1>

//               <p className="-mt-1 text-[8px] font-medium tracking-wide text-gray-400">
//                 Your Health. Our Intelligence.
//               </p>

//             </div>

//           </div>


//           {/* Navigation */}

//           <nav className="flex h-full flex-1 items-center justify-center gap-1">

//             {navigation.map(
//               ([label, Icon], index) => (

//                 <button
//                   key={label}
//                   className={`group relative flex h-full items-center gap-2 px-3 text-[12px] font-medium transition
//                   ${
//                     index === 0
//                       ? "text-[#12833a]"
//                       : "text-gray-600 hover:text-[#12833a]"
//                   }`}
//                 >

//                   <Icon
//                     size={16}
//                     strokeWidth={1.8}
//                   />

//                   <span>
//                     {label}
//                   </span>

//                   {index === 0 && (
//                     <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-[#16a34a]" />
//                   )}

//                 </button>

//               )
//             )}

//             <button className="flex items-center gap-1 px-3 text-[12px] font-medium text-gray-600">

//               More

//               <ChevronDown size={13} />

//             </button>

//           </nav>


//           {/* Right */}

//           <div className="flex min-w-[110px] items-center justify-end gap-5">

//             <button className="relative text-gray-600 transition hover:text-[#159447]">

//               <Bell
//                 size={20}
//                 strokeWidth={1.8}
//               />

//               <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#159447] text-[10px] font-bold text-white">

//                 {alerts.length}

//               </span>

//             </button>


//             <button className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600">

//               <UserRound size={20} />

//             </button>


//             {/* Logout */}

//             <button
//               onClick={handleLogout}
//               className="flex h-9 items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-[11px] font-semibold text-red-500 transition hover:bg-red-100"
//               title="Logout"
//             >

//               <LogOut size={16} />

//               <span>
//                 Logout
//               </span>

//             </button>

//           </div>

//         </div>

//       </header>


//       {/* =====================================================
//           MAIN
//       ===================================================== */}

//       <main className="mx-auto max-w-[1500px] space-y-4 p-5">


//         {/* =====================================================
//             PATIENT HEADER
//         ===================================================== */}

//         <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_3px_18px_rgba(0,0,0,0.035)]">

//           <div className="flex items-center justify-between gap-6">


//             {/* Patient */}

//             <div className="flex items-center gap-5">

//               <div className="h-[92px] w-[92px] overflow-hidden rounded-full border-4 border-[#edf7f0] bg-[#e9f6ed]">

//                 <img
//                   src="/patient.png"
//                   alt="Patient"
//                   className="h-full w-full object-cover"
//                 />

//               </div>


//               <div>

//                 <h2 className="text-[22px] font-bold tracking-tight text-gray-900">

//                   Welcome back,{" "}
//                   {patient.name}

//                   <span>
//                     👋
//                   </span>

//                 </h2>


//                 <div className="mt-3 flex gap-9">

//                   <PatientInfo
//                     label="Patient ID"
//                     value={patient.patientId}
//                   />

//                   <PatientInfo
//                     label="Age / Gender"
//                     value={`${patient.age} Y / ${patient.gender}`}
//                   />

//                   <PatientInfo
//                     label="Blood Group"
//                     value={patient.bloodGroup}
//                   />

//                   <PatientInfo
//                     label="Phone"
//                     value={patient.phone}
//                   />

//                 </div>


//                 <div className="mt-3 flex gap-2">

//                   <Tag>
//                     Height:{" "}
//                     {patient.height
//                       ? `${patient.height} cm`
//                       : "—"}
//                   </Tag>

//                   <Tag>
//                     Weight:{" "}
//                     {patient.weight
//                       ? `${patient.weight} kg`
//                       : "—"}
//                   </Tag>


//                   <Tag>

//                     BMI:{" "}

//                     <span className="font-bold text-[#159447]">

//                       {bmi
//                         ? `${bmi} (${bmiStatus})`
//                         : "Not available"}

//                     </span>

//                   </Tag>

//                 </div>

//               </div>

//             </div>


//             {/* Health Score */}

//             <div className="w-[235px] rounded-xl border border-gray-200 bg-white p-4">

//               <div className="flex items-center gap-3">

//                 <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f7ed] text-[#159447]">

//                   <Activity size={24} />

//                 </div>


//                 <div className="flex-1">

//                   <p className="text-[12px] text-gray-500">
//                     Health Score
//                   </p>


//                   <div className="flex items-end gap-1">

//                     <strong className="text-[29px] font-bold">
//                       {healthScore}
//                     </strong>

//                     <span className="mb-1 text-[12px] text-gray-400">
//                       /100
//                     </span>

//                   </div>

//                 </div>


//                 <span className="text-[12px] font-semibold text-[#159447]">

//                   {healthScore >= 80
//                     ? "Good"
//                     : healthScore >= 60
//                     ? "Fair"
//                     : "Needs Attention"}

//                 </span>

//               </div>


//               <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

//                 <div
//                   className="h-full rounded-full bg-[#159447]"
//                   style={{
//                     width: `${healthScore}%`,
//                   }}
//                 />

//               </div>


//               <p className="mt-2 text-[11px] text-gray-500">

//                 {healthScore >= 80
//                   ? "You're doing great! Keep it up."
//                   : "Please review your health alerts."}

//               </p>

//             </div>


//             {/* Conditions */}

//             <div className="w-[210px] rounded-xl border border-[#cfe9d6] bg-gradient-to-br from-[#f8fff9] to-[#eefaf1] p-4">

//               <MiniMetric
//                 icon={<Heart size={19} />}
//                 title="Active Conditions"
//                 value={conditions.length}
//                 subtitle="Managed"
//               />


//               <div className="my-3 h-px bg-[#d9eddd]" />


//               <MiniMetric
//                 icon={<Pill size={19} />}
//                 title="Total Medications"
//                 value={medications.length}
//                 subtitle="Active"
//               />

//             </div>

//           </div>

//         </section>


//         {/* =====================================================
//             MAIN GRID
//         ===================================================== */}

//         <section className="grid grid-cols-[1.05fr_1.45fr_1fr] gap-4">


//           {/* ===================================================
//               LEFT COLUMN
//           =================================================== */}

//           <div className="space-y-4">


//             {/* Health at glance */}

//             <DashboardCard>

//               <CardHeading
//                 icon={<LineChart size={17} />}
//                 title="Health At a Glance"
//               />


//               <div className="mt-4 grid grid-cols-3 gap-2">

//                 <StatCard
//                   title="Recent Labs"
//                   value={labs.length}
//                   subtitle="Available"
//                   icon={TestTube2}
//                 />

//                 <StatCard
//                   title="Active Conditions"
//                   value={conditions.length}
//                   subtitle="Managed"
//                   icon={Heart}
//                 />

//                 <StatCard
//                   title="Medications"
//                   value={medications.length}
//                   subtitle="Active"
//                   icon={Pill}
//                 />

//                 <StatCard
//                   title="Upcoming Tests"
//                   value={
//                     appointments.filter(
//                       (a) => a.type === "test"
//                     ).length
//                   }
//                   subtitle="Due Soon"
//                   icon={TestTube2}
//                 />

//                 <StatCard
//                   title="Appointments"
//                   value={appointments.length}
//                   subtitle="Scheduled"
//                   icon={CalendarDays}
//                 />

//                 <StatCard
//                   title="Critical Alerts"
//                   value={
//                     alerts.filter(
//                       (a) => a.type === "red"
//                     ).length
//                   }
//                   subtitle="Right Now"
//                   icon={AlertTriangle}
//                 />

//               </div>

//             </DashboardCard>


//             {/* Health Insights */}

//             <DashboardCard className="relative overflow-hidden">

//               <div className="flex items-center justify-between">

//                 <div>

//                   <h3 className="text-[15px] font-semibold text-[#16833d]">
//                     Health Insights
//                   </h3>

//                   <p className="mt-3 text-[12px] leading-5 text-gray-600">

//                     {labs.length > 0
//                       ? "Your recent lab records are available for review."
//                       : "Add your lab results to receive personalized health insights."}

//                   </p>


//                   <button className="mt-4 flex items-center gap-1 rounded-lg border border-[#d9eadc] bg-white px-3 py-2 text-[11px] font-semibold text-[#159447] transition hover:bg-[#f1faf3]">

//                     View Detailed Insights

//                     <ChevronRight size={14} />

//                   </button>

//                 </div>


//                 {/* Decorative graph */}

//                 <div className="relative mr-3 h-24 w-28">

//                   <div className="absolute bottom-2 left-2 h-12 w-4 rounded-t bg-[#bce6c9]" />

//                   <div className="absolute bottom-2 left-8 h-20 w-4 rounded-t bg-[#72ce8c]" />

//                   <div className="absolute bottom-2 left-14 h-14 w-4 rounded-t bg-[#35ae5d]" />

//                   <div className="absolute right-1 top-2 h-14 w-14 rounded-full border-[9px] border-[#159447] border-r-transparent" />

//                   <Leaf
//                     size={25}
//                     className="absolute right-0 top-0 text-[#b8e4c3]"
//                   />

//                 </div>

//               </div>

//             </DashboardCard>

//           </div>


//           {/* ===================================================
//               CENTER COLUMN
//           =================================================== */}

//           <DashboardCard className="min-w-0">

//             <div className="flex items-center justify-between">

//               <CardHeading
//                 icon={<Heart size={17} />}
//                 title="Lab Trends Overview"
//               />

//               <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600 outline-none">

//                 <option>
//                   Last 6 Months
//                 </option>

//                 <option>
//                   Last 1 Year
//                 </option>

//               </select>

//             </div>


//             {/* Tabs */}

//             <div className="mt-4 flex gap-2 overflow-x-auto pb-1">

//               <LabTab active>
//                 HbA1c (%)
//               </LabTab>

//               <LabTab>
//                 Fasting Glucose (mg/dL)
//               </LabTab>

//               <LabTab>
//                 Creatinine (mg/dL)
//               </LabTab>

//               <LabTab>
//                 LDL Cholesterol (mg/dL)
//               </LabTab>

//             </div>


//             {/* Graph */}

//             <div className="mt-3 h-[230px] w-full">

//               <ResponsiveContainer
//                 width="100%"
//                 height="100%"
//               >

//                 <AreaChart data={labData}>

//                   <defs>

//                     <linearGradient
//                       id="meridianGreen"
//                       x1="0"
//                       y1="0"
//                       x2="0"
//                       y2="1"
//                     >

//                       <stop
//                         offset="0%"
//                         stopColor="#159447"
//                         stopOpacity={0.2}
//                       />

//                       <stop
//                         offset="100%"
//                         stopColor="#159447"
//                         stopOpacity={0.01}
//                       />

//                     </linearGradient>

//                   </defs>


//                   <CartesianGrid
//                     stroke="#edf1ee"
//                     strokeDasharray="3 3"
//                     vertical={false}
//                   />


//                   <XAxis
//                     dataKey="month"
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{
//                       fontSize: 10,
//                       fill: "#737b76",
//                     }}
//                   />


//                   <YAxis
//                     domain={[0, 12]}
//                     axisLine={false}
//                     tickLine={false}
//                     tick={{
//                       fontSize: 10,
//                       fill: "#737b76",
//                     }}
//                   />


//                   <Tooltip />


//                   <Area
//                     type="monotone"
//                     dataKey="value"
//                     stroke="#159447"
//                     strokeWidth={2.5}
//                     fill="url(#meridianGreen)"
//                     dot={{
//                       r: 4,
//                       fill: "#159447",
//                       stroke: "#fff",
//                       strokeWidth: 2,
//                     }}
//                   />

//                 </AreaChart>

//               </ResponsiveContainer>

//             </div>


//             {/* Lab summary */}

//             <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200">

//               <LabSummary
//                 label="Latest HbA1c"
//                 value={
//                   latestHbA1c
//                     ? `${latestHbA1c.value}%`
//                     : "—"
//                 }
//                 sub={
//                   latestHbA1c
//                     ? latestHbA1c.date
//                     : "No data"
//                 }
//               />


//               <LabSummary
//                 label="Change"
//                 value="—"
//                 sub="Add more lab records"
//               />


//               <LabSummary
//                 label="Interpretation"
//                 value={
//                   latestHbA1c
//                     ? latestHbA1c.value > 6.5
//                       ? "Above target"
//                       : "Within target"
//                     : "No data"
//                 }
//                 valueClass={
//                   latestHbA1c &&
//                   latestHbA1c.value > 6.5
//                     ? "text-orange-500"
//                     : "text-[#159447]"
//                 }
//               />

//             </div>


//             {/* Recommendation */}

//             <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#d9eddd] bg-[#f4fbf6] px-3 py-2.5 text-[11px] text-[#3c6247]">

//               <Leaf
//                 size={16}
//                 className="text-[#159447]"
//               />

//               <span>

//                 <b className="text-[#16833d]">
//                   Recommendation:
//                 </b>{" "}

//                 {latestHbA1c &&
//                 latestHbA1c.value > 6.5
//                   ? "Please follow your doctor's advice and maintain regular monitoring."
//                   : "Add your health records to receive personalized recommendations."}

//               </span>

//             </div>

//           </DashboardCard>


//           {/* ===================================================
//               RIGHT COLUMN
//           =================================================== */}

//           <div className="space-y-4">


//             {/* Upload */}

//             <DashboardCard>

//               <CardHeading
//                 icon={<Upload size={17} />}
//                 title="Upload Health Report"
//               />


//               <div className="mt-4 rounded-xl border-2 border-dashed border-[#b8dfc1] bg-[#fbfefc] p-5 text-center">

//                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f8ed] text-[#159447]">

//                   <Upload size={25} />

//                 </div>


//                 <p className="mt-3 text-[12px] font-medium text-gray-700">

//                   Drag & drop your report here

//                 </p>


//                 <p className="my-2 text-[10px] text-gray-400">
//                   or
//                 </p>


//                 <button className="rounded-lg bg-[#159447] px-5 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#117d3b] hover:shadow-md">

//                   Choose File

//                 </button>


//                 <p className="mt-3 text-[9px] text-gray-400">

//                   Supports: PDF, JPG, PNG (Max 10MB)

//                 </p>

//               </div>


//               {/* Recent uploads */}

//               <div className="mt-4 flex items-center justify-between">

//                 <h4 className="text-[11px] font-bold text-gray-700">
//                   Recent Uploads
//                 </h4>


//                 <button className="text-[10px] font-semibold text-[#159447]">
//                   View All
//                 </button>

//               </div>


//               <div className="mt-2 space-y-1">

//                 {reports.length > 0 ? (

//                   reports
//                     .slice(-3)
//                     .reverse()
//                     .map((report) => (

//                       <UploadedFile
//                         key={report.id}
//                         icon={
//                           report.type?.includes("image")
//                             ? <FileImage />
//                             : <FileText />
//                         }
//                         name={
//                           report.name ||
//                           report.fileName ||
//                           "Health Report"
//                         }
//                         details={
//                           report.date ||
//                           report.size ||
//                           "Uploaded report"
//                         }
//                       />

//                     ))

//                 ) : (

//                   <p className="px-2 py-3 text-center text-[9px] text-gray-400">

//                     No reports uploaded yet.

//                   </p>

//                 )}

//               </div>

//             </DashboardCard>


//             {/* Quick actions */}

//             <DashboardCard>

//               <CardHeading title="Quick Actions" />


//               <div className="mt-3 grid grid-cols-2 gap-2">

//                 <QuickAction
//                   icon={<CalendarDays />}
//                   label="Book Appointment"
//                 />

//                 <QuickAction
//                   icon={<ClipboardList />}
//                   label="View Prescriptions"
//                 />

//                 <QuickAction
//                   icon={<Share2 />}
//                   label="Share Records"
//                 />

//                 <QuickAction
//                   icon={<Download />}
//                   label="Download Summary"
//                 />

//               </div>

//             </DashboardCard>

//           </div>

//         </section>


//         {/* =====================================================
//             BOTTOM ROW
//         ===================================================== */}

//         <section className="grid grid-cols-[1fr_1fr_1.7fr] gap-4">


//           {/* Need Help */}

//           <DashboardCard>

//             <div className="flex gap-4">

//               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eaf8ee] text-[#159447]">

//                 <HelpCircle size={27} />

//               </div>


//               <div>

//                 <h3 className="text-[14px] font-semibold">
//                   Need Help?
//                 </h3>


//                 <p className="mt-2 text-[11px] leading-5 text-gray-500">

//                   Our support team is here to assist you
//                   with any queries or issues.

//                 </p>


//                 <button className="mt-3 flex items-center gap-1 rounded-lg border border-[#d5ead9] px-3 py-2 text-[10px] font-semibold text-[#159447] hover:bg-[#f2faf4]">

//                   Contact Support

//                   <ChevronRight size={13} />

//                 </button>

//               </div>

//             </div>

//           </DashboardCard>


//           {/* Monthly summary */}

//           <DashboardCard>

//             <h3 className="text-[14px] font-semibold">
//               Monthly Health Summary
//             </h3>


//             <div className="mt-4 flex items-center gap-6">

//               <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-[#159447] border-r-[#dff0e3]">

//                 <div className="text-center">

//                   <strong className="block text-[15px] text-[#159447]">
//                     {labs.length > 0
//                       ? "Good"
//                       : "No Data"}
//                   </strong>

//                   <span className="text-[9px] text-gray-400">
//                     Status
//                   </span>

//                 </div>

//               </div>


//               <div className="space-y-3 text-[11px]">

//                 <SummaryItem
//                   color="bg-[#159447]"
//                   label="Normal"
//                   value={
//                     labs.filter(
//                       (lab) =>
//                         lab.status === "normal"
//                     ).length
//                   }
//                 />

//                 <SummaryItem
//                   color="bg-orange-400"
//                   label="Abnormal"
//                   value={
//                     labs.filter(
//                       (lab) =>
//                         lab.status === "abnormal"
//                     ).length
//                   }
//                 />

//                 <SummaryItem
//                   color="bg-red-500"
//                   label="Critical"
//                   value={
//                     labs.filter(
//                       (lab) =>
//                         lab.status === "critical"
//                     ).length
//                   }
//                 />

//               </div>

//             </div>


//             <p className="mt-3 text-[9px] text-gray-400">
//               Based on your recent lab results
//             </p>

//           </DashboardCard>


//           {/* Risk */}

//           <DashboardCard>

//             <div className="flex items-center justify-between">

//               <h3 className="text-[14px] font-semibold">
//                 Risk & Safety Alerts
//               </h3>


//               <button className="text-[10px] font-semibold text-[#159447]">
//                 View All
//               </button>

//             </div>


//             <div className="mt-2 divide-y divide-gray-100">

//               {alerts.length > 0 ? (

//                 alerts
//                   .slice(-3)
//                   .reverse()
//                   .map((alert) => (

//                     <RiskAlert
//                       key={alert.id}
//                       type={alert.type || "yellow"}
//                       title={
//                         alert.title ||
//                         "Health Alert"
//                       }
//                       description={
//                         alert.description ||
//                         "Please review this alert."
//                       }
//                       date={
//                         alert.date ||
//                         "Recent"
//                       }
//                     />

//                   ))

//               ) : (

//                 <div className="py-5 text-center">

//                   <ShieldCheck
//                     size={24}
//                     className="mx-auto text-[#159447]"
//                   />

//                   <p className="mt-2 text-[10px] text-gray-500">

//                     No active safety alerts.

//                   </p>

//                 </div>

//               )}

//             </div>

//           </DashboardCard>

//         </section>

//       </main>


//       {/* =====================================================
//           FOOTER
//       ===================================================== */}

//       <footer className="mt-2 border-t border-gray-200 bg-white px-6 py-3">

//         <div className="mx-auto flex max-w-[1500px] items-center gap-2 text-[10px] text-gray-400">

//           <ShieldCheck
//             size={13}
//             className="text-[#159447]"
//           />

//           <span>
//             Your data is secure & encrypted
//           </span>

//           <span>
//             •
//           </span>

//           <span>
//             MERIDIAN follows HIPAA compliant practices
//           </span>

//           <span className="ml-auto">
//             © 2025 MERIDIAN Health Systems
//           </span>

//         </div>

//       </footer>

//     </div>

//   );
// }


// /* ============================================================
//    SMALL COMPONENTS
// ============================================================ */

// function PatientInfo({
//   label,
//   value,
// }) {

//   return (

//     <div>

//       <p className="text-[9px] font-medium text-gray-400">
//         {label}
//       </p>

//       <p className="mt-1 text-[12px] font-semibold text-gray-700">
//         {value || "—"}
//       </p>

//     </div>

//   );
// }


// function Tag({ children }) {

//   return (

//     <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[9px] font-medium text-gray-600">

//       {children}

//     </span>

//   );

// }


// function MiniMetric({
//   icon,
//   title,
//   value,
//   subtitle,
// }) {

//   return (

//     <div className="flex items-center gap-3">

//       <div className="text-[#159447]">
//         {icon}
//       </div>


//       <div>

//         <p className="text-[10px] text-gray-600">
//           {title}
//         </p>


//         <div className="flex items-baseline gap-2">

//           <strong className="text-[20px]">
//             {value}
//           </strong>

//           <span className="text-[9px] text-[#159447]">
//             {subtitle}
//           </span>

//         </div>

//       </div>

//     </div>

//   );

// }


// function DashboardCard({
//   children,
//   className = "",
// }) {

//   return (

//     <div
//       className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_3px_18px_rgba(0,0,0,0.035)] ${className}`}
//     >

//       {children}

//     </div>

//   );

// }


// function CardHeading({
//   icon,
//   title,
// }) {

//   return (

//     <div className="flex items-center gap-2">

//       {icon && (

//         <span className="text-[#159447]">
//           {icon}
//         </span>

//       )}

//       <h3 className="text-[14px] font-semibold text-gray-800">
//         {title}
//       </h3>

//     </div>

//   );

// }


// function StatCard({
//   title,
//   value,
//   subtitle,
//   icon: Icon,
// }) {

//   return (

//     <div className="group flex min-h-[95px] flex-col items-center justify-center rounded-xl border border-gray-100 bg-[#fcfefd] px-2 py-3 text-center transition hover:-translate-y-0.5 hover:border-[#cce8d3] hover:bg-[#f7fcf8]">

//       <Icon
//         size={19}
//         className="text-[#159447]"
//         strokeWidth={1.8}
//       />

//       <strong className="mt-2 text-[17px]">
//         {value}
//       </strong>

//       <span className="mt-0.5 text-[10px] font-semibold text-gray-700">
//         {title}
//       </span>

//       <small className="mt-0.5 text-[8px] text-gray-400">
//         {subtitle}
//       </small>

//     </div>

//   );

// }


// function LabTab({
//   children,
//   active = false,
// }) {

//   return (

//     <button
//       className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-medium transition ${
//         active
//           ? "bg-[#159447] text-white shadow-sm"
//           : "border border-gray-200 bg-white text-gray-600 hover:border-[#b9ddc2] hover:text-[#159447]"
//       }`}
//     >

//       {children}

//     </button>

//   );

// }


// function LabSummary({
//   label,
//   value,
//   sub,
//   valueClass = "",
// }) {

//   return (

//     <div className="border-r border-gray-100 px-4 py-3 last:border-0">

//       <p className="text-[10px] font-medium text-[#159447]">
//         {label}
//       </p>

//       <strong
//         className={`mt-1 block text-[18px] font-semibold ${valueClass}`}
//       >
//         {value}
//       </strong>

//       {sub && (

//         <span className="text-[9px] text-gray-400">
//           {sub}
//         </span>

//       )}

//     </div>

//   );

// }


// function UploadedFile({
//   icon,
//   name,
//   details,
// }) {

//   return (

//     <div className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-[#f7faf8]">

//       <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f8f2] text-[#159447]">

//         {React.cloneElement(
//           icon,
//           {
//             size: 16,
//           }
//         )}

//       </div>


//       <div className="min-w-0 flex-1">

//         <p className="truncate text-[10px] font-semibold text-gray-700">
//           {name}
//         </p>

//         <p className="mt-0.5 text-[8px] text-gray-400">
//           {details}
//         </p>

//       </div>


//       <Download
//         size={14}
//         className="text-[#159447]"
//       />

//     </div>

//   );

// }


// function QuickAction({
//   icon,
//   label,
// }) {

//   return (

//     <button className="flex items-center gap-2 rounded-xl border border-[#e3eee5] bg-[#f8fcf9] px-3 py-3 text-left text-[10px] font-semibold text-gray-700 transition hover:border-[#b8ddc0] hover:bg-[#eef9f1] hover:text-[#159447]">

//       {React.cloneElement(
//         icon,
//         {
//           size: 17,
//           className: "text-[#159447]",
//         }
//       )}

//       {label}

//     </button>

//   );

// }


// function SummaryItem({
//   color,
//   label,
//   value,
// }) {

//   return (

//     <div className="flex items-center gap-2">

//       <span
//         className={`h-2 w-2 rounded-full ${color}`}
//       />

//       <span className="w-16 text-gray-600">
//         {label}
//       </span>

//       <strong>
//         {value}
//       </strong>

//     </div>

//   );

// }


// function RiskAlert({
//   type,
//   title,
//   description,
//   date,
// }) {

//   const colors = {

//     red:
//       "bg-red-50 text-red-500",

//     orange:
//       "bg-orange-50 text-orange-500",

//     yellow:
//       "bg-yellow-50 text-yellow-500",

//   };


//   return (

//     <div className="flex items-center gap-3 py-2.5">

//       <div
//         className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
//           colors[type] || colors.yellow
//         }`}
//       >

//         <AlertTriangle size={15} />

//       </div>


//       <div className="min-w-0 flex-1">

//         <p className="text-[10px] font-semibold text-gray-700">
//           {title}
//         </p>

//         <p className="truncate text-[9px] text-gray-500">
//           {description}
//         </p>

//       </div>


//       <span className="whitespace-nowrap text-[8px] text-gray-400">
//         {date}
//       </span>

//     </div>

//   );

// }

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Activity,
  AlertTriangle,
  Bell,
  Camera,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileImage,
  FileText,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  LineChart,
  Pill,
  Share2,
  ShieldCheck,
  TestTube2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../../firebase";
import Navbar from "../../components/Navbar";
import { fetchProfile } from "../../services/profileService";
import { deleteReport, downloadReport, fetchReports, uploadReport } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";


/* ============================================================
   DEFAULT DATA
============================================================ */

const emptyPatient = {
  name: "Patient",
  patientId: "—",
  age: "—",
  gender: "—",
  bloodGroup: "—",
  phone: "—",
  height: "",
  weight: "",
  bmi: "",
  profileImage: "",
};
const formatHeight = (centimeters) => {
  const totalInches = Number(centimeters) / 2.54;
  if (!Number.isFinite(totalInches) || totalInches <= 0) return "";
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${inches === 12 ? feet + 1 : feet}' ${inches === 12 ? 0 : inches}"`;
};
const formatUploadDateTime = (value) => {
  const date = value?.toDate ? value.toDate() : new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Uploaded report";
};
const reportCacheKey = (uid) => `meridian-reports-${uid}`;
const readCachedReports = (uid) => {
  try {
    return JSON.parse(localStorage.getItem(reportCacheKey(uid)) || "[]");
  } catch {
    return [];
  }
};
const mergeReports = (...reportLists) => reportLists.flat().filter((report, index, all) => {
  const reportKey = report._id || report.reportId || report.id || report.fileName;
  return index === all.findIndex((item) => String(item._id || item.reportId || item.id || item.fileName) === String(reportKey));
});


/* ============================================================
   LAB TYPES
============================================================ */

const labTypes = {
  "HbA1c (%)": {
    keys: ["HbA1c", "hba1c"],
    unit: "%",
    domain: [0, 12],
  },

  "Fasting Glucose (mg/dL)": {
    keys: [
      "Fasting Glucose",
      "fasting glucose",
      "glucose",
      "Fasting Blood Sugar",
      "FBS",
    ],
    unit: "mg/dL",
    domain: [0, 250],
  },

  "Creatinine (mg/dL)": {
    keys: ["Creatinine", "creatinine"],
    unit: "mg/dL",
    domain: [0, 5],
  },

  "LDL Cholesterol (mg/dL)": {
    keys: [
      "LDL",
      "LDL Cholesterol",
      "ldl cholesterol",
    ],
    unit: "mg/dL",
    domain: [0, 250],
  },
};


/* ============================================================
   DASHBOARD
============================================================ */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: sessionUser } = useAuth();

  const [patient, setPatient] = useState({
    ...emptyPatient,
    name: sessionUser?.name || sessionUser?.displayName || "Patient",
  });

  const [medications, setMedications] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [labs, setLabs] = useState([]);
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedLab, setSelectedLab] =
    useState("HbA1c (%)");

  const [uploadFiles, setUploadFiles] =
    useState([]);

  const [uploading, setUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);


  /* ==========================================================
     LOAD USER DATA
  ========================================================== */

  useEffect(() => {

    let unsubscribe;

    const loadPatientData = async (user) => {

      if (!user) {

        setLoading(false);

        return;
      }

      try {

        const loginName = sessionUser?.name || sessionUser?.displayName || user.displayName || "Patient";
        setPatient((current) => ({ ...current, name: loginName }));

        /* ------------------------------------------------------
           PATIENT
        ------------------------------------------------------ */

        const profile = await fetchProfile();
        const profilePatient = profile.patient || {};
        const dateOfBirth = profilePatient.dateOfBirth ? new Date(profilePatient.dateOfBirth) : null;
        const calculatedAge = dateOfBirth && !Number.isNaN(dateOfBirth.getTime())
          ? Math.max(0, new Date().getFullYear() - dateOfBirth.getFullYear() - ((new Date().getMonth() < dateOfBirth.getMonth() || (new Date().getMonth() === dateOfBirth.getMonth() && new Date().getDate() < dateOfBirth.getDate())) ? 1 : 0))
          : "—";

        setPatient({
          ...emptyPatient,
          name: profile.name || loginName,
          patientId: profilePatient.patientCode || profilePatient._id || profile.id || "—",
          age: profilePatient.age ?? calculatedAge,
          gender: profilePatient.gender || "—",
          bloodGroup: profilePatient.bloodGroup || "—",
          phone: profile.phone || user.phoneNumber || "—",
          height: profilePatient.height || "",
          weight: profilePatient.weight || "",
          bmi: profilePatient.bmi || "",
          profileImage: localStorage.getItem("profileImage") || "",
        });


        /* ------------------------------------------------------
           LOAD ALL COLLECTIONS IN PARALLEL TO REDUCE DASHBOARD WAIT
        ------------------------------------------------------ */

        const apiReports = await fetchReports().catch(() => []);
        const serverReportList = Array.isArray(apiReports)
          ? apiReports
          : apiReports.reports || [];
        setReports(serverReportList);
        localStorage.setItem(reportCacheKey(user.uid), JSON.stringify(serverReportList));

        const [conditionsSnap, medicationsSnap, labsSnap, appointmentsSnap, alertsSnap] =
          await Promise.all([
            getDocs(query(collection(db, "conditions"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "medications"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "labResults"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "appointments"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "alerts"), where("userId", "==", user.uid))),
          ]);

        const firestoreConditions = conditionsSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setConditions(
          firestoreConditions.length > 0
            ? firestoreConditions
            : (profilePatient.conditions || []).map((item, index) => ({
                id: item._id || `profile-condition-${index}`,
                ...(typeof item === "string" ? { name: item } : item),
              }))
        );

        setMedications(
          medicationsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );

        setLabs(
          labsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );

        setAppointments(
          appointmentsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );

        setAlerts(
          alertsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );

      } catch (error) {

        console.error(
          "Error loading patient dashboard:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


    unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          loadPatientData(user);
        }
      );


    return () => {

      if (unsubscribe) {
        unsubscribe();
      }

    };

  }, []);


  /* ============================================================
     BMI
  ============================================================ */

  const bmi = useMemo(() => {

    if (patient.bmi) {
      return Number(patient.bmi).toFixed(1);
    }

    const height =
      Number(patient.height);

    const weight =
      Number(patient.weight);

    if (
      !height ||
      !weight ||
      height <= 0 ||
      weight <= 0
    ) {
      return null;
    }

    const heightMeters =
      height / 100;

    return (
      weight /
      (heightMeters * heightMeters)
    ).toFixed(1);

  }, [
    patient.height,
    patient.weight,
  ]);


  /* ============================================================
     BMI STATUS
  ============================================================ */

  const bmiStatus = useMemo(() => {

    if (!bmi) {
      return "Not available";
    }

    const value =
      Number(bmi);

    if (value < 18.5) {
      return "Underweight";
    }

    if (value < 25) {
      return "Normal";
    }

    if (value < 30) {
      return "Overweight";
    }

    return "Obese";

  }, [bmi]);


  /* ============================================================
     CURRENT LAB CONFIG
  ============================================================ */

  const currentLabConfig =
    labTypes[selectedLab];


  /* ============================================================
     LAB TREND DATA
  ============================================================ */

  const labData = useMemo(() => {

    const keys =
      currentLabConfig.keys;

    const matchingLabs =
      labs
        .filter((lab) => {

          const type =
            String(
              lab.type ||
              lab.testName ||
              lab.name ||
              ""
            ).toLowerCase();

          return keys.some(
            (key) =>
              type === key.toLowerCase()
          );

        })
        .map((lab) => {

          const rawValue =
            lab.value ??
            lab.result ??
            lab.numericValue;

          const value =
            Number(rawValue);

          let month =
            lab.month ||
            lab.date ||
            lab.createdAt ||
            "—";

          if (
            typeof month === "object" &&
            month?.toDate
          ) {
            month =
              month.toDate()
                .toLocaleDateString(
                  "en-IN",
                  {
                    month: "short",
                    year: "numeric",
                  }
                );
          }

          return {
            month: String(month),
            value,
          };

        })
        .filter(
          (lab) =>
            Number.isFinite(lab.value) &&
            lab.value > 0
        );


    return matchingLabs.slice(-6);

  }, [
    labs,
    selectedLab,
    currentLabConfig,
  ]);


  /* ============================================================
     LATEST LAB
  ============================================================ */

  const latestLab = useMemo(() => {

    if (!labData.length) {
      return null;
    }

    return labData[
      labData.length - 1
    ];

  }, [labData]);


  /* ============================================================
     PREVIOUS LAB
  ============================================================ */

  const previousLab = useMemo(() => {

    if (labData.length < 2) {
      return null;
    }

    return labData[
      labData.length - 2
    ];

  }, [labData]);


  /* ============================================================
     LAB CHANGE
  ============================================================ */

  const labChange = useMemo(() => {

    if (
      !latestLab ||
      !previousLab
    ) {
      return null;
    }

    return (
      latestLab.value -
      previousLab.value
    ).toFixed(1);

  }, [
    latestLab,
    previousLab,
  ]);


  /* ============================================================
     HEALTH SCORE
  ============================================================ */

  const healthScore = useMemo(() => {
    const profileValues = [
      patient.age !== "—" && patient.age !== "",
      patient.gender !== "—" && patient.gender !== "",
      patient.bloodGroup !== "—" && patient.bloodGroup !== "",
      Number(patient.height) > 0,
      Number(patient.weight) > 0,
      Number(patient.bmi) > 0 || Boolean(bmi),
    ];
    const profileScore = (profileValues.filter(Boolean).length / profileValues.length) * 25;
    const labScore = labs.length
      ? labs.reduce((total, lab) => {
          const status = String(lab.status || "recorded").toLowerCase();
          return total + (status === "normal" ? 45 : status === "abnormal" ? 28 : status === "critical" ? 10 : 32);
        }, 0) / labs.length
      : 0;
    const alertScore = Math.max(
      0,
      20 - alerts.filter((alert) => alert.type === "red").length * 12 - alerts.filter((alert) => alert.type === "orange").length * 7 - alerts.filter((alert) => alert.type === "yellow").length * 3,
    );
    const activityScore = Math.min(10, medications.length * 2 + appointments.length);
    return Math.round(Math.min(100, profileScore + labScore + alertScore + activityScore));
  }, [alerts, appointments.length, bmi, labs, medications.length, patient]);


  /* ============================================================
     LAB STATUS COUNTS
  ============================================================ */

  const normalLabs =
    labs.filter(
      (lab) =>
        String(lab.status || "")
          .toLowerCase() ===
        "normal"
    ).length;

  const abnormalLabs =
    labs.filter(
      (lab) =>
        String(lab.status || "")
          .toLowerCase() ===
        "abnormal"
    ).length;

  const criticalLabs =
    labs.filter(
      (lab) =>
        String(lab.status || "")
          .toLowerCase() ===
        "critical"
    ).length;


  /* ============================================================
     FILE SELECTION
  ============================================================ */

  const handleChooseFile = () => {

    fileInputRef.current?.click();

  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const profileImage = canvas.toDataURL("image/jpeg", 0.82);
        localStorage.setItem("profileImage", profileImage);
        setPatient((current) => ({ ...current, profileImage }));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    const invalidFile = files.find((file) => !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      setUploadMessage("Each file must be a PDF, JPG or PNG under 10MB.");
      setUploadFiles([]);
      return;
    }
    setUploadFiles(files);
    setUploadMessage(`${files.length} report${files.length === 1 ? "" : "s"} selected`);

  };

  const handleUploadReports = async () => {
    if (!uploadFiles.length) return;
    try {
      setUploading(true);
      setUploadMessage("Uploading reports...");
      const uploaded = await Promise.all(uploadFiles.map((file) => uploadReport(file)));
      const uploadedReports = uploaded.map((item) => item.report || item);
      setReports((currentReports) => {
        const nextReports = mergeReports(uploadedReports, currentReports);
        const userId = auth.currentUser?.uid;
        if (userId) localStorage.setItem(reportCacheKey(userId), JSON.stringify(nextReports));
        return nextReports;
      });
      fetchReports().then((latestReports) => {
        const serverReports = Array.isArray(latestReports) ? latestReports : latestReports.reports || [];
        setReports((currentReports) => {
          const nextReports = mergeReports(currentReports, serverReports);
          const userId = auth.currentUser?.uid;
          if (userId) localStorage.setItem(reportCacheKey(userId), JSON.stringify(nextReports));
          return nextReports;
        });
      }).catch(() => {});
      setUploadFiles([]);
      setUploadMessage("Reports uploaded successfully.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadMessage(error.message || "Unable to upload reports.");
    } finally {
      setUploading(false);
    }
  };


  const clearSelectedFile = () => {

    setUploadFiles([]);

    setUploadMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

  };

  const handleDeleteReport = async (report) => {
    const reportId = report._id || report.reportId || report.id;
    if (!reportId || !window.confirm(`Delete ${report.name || report.fileName || "this report"}?`)) return;
    try {
      await deleteReport(reportId);
      setReports((currentReports) => {
        const nextReports = currentReports.filter((item) => String(item._id || item.id || item.reportId) !== String(reportId));
        const userId = auth.currentUser?.uid;
        if (userId) localStorage.setItem(reportCacheKey(userId), JSON.stringify(nextReports));
        return nextReports;
      });
      setUploadMessage("Report deleted successfully.");
    } catch (error) {
      setUploadMessage(error.message || "Unable to delete report.");
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      await downloadReport(report);
    } catch (error) {
      setUploadMessage(error.message || "Unable to download report.");
    }
  };

  const recentReports = [...reports]
    .sort((first, second) => new Date(second.date || second.createdAt) - new Date(first.date || first.createdAt))
    .slice(0, 3);


  /* ============================================================
     UI
  ============================================================ */

  return (

    <div className="min-h-screen bg-[#f5faf7] text-[#183a28]">


      <Navbar />


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1500px] space-y-5 px-4 pb-10 pt-5 sm:px-6 lg:px-8">


        {/* ====================================================
            PATIENT HEADER
        ==================================================== */}

        <section className="rounded-[26px] border border-[#d5ebdc] bg-gradient-to-br from-white via-white to-[#edf9f0] p-5 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:p-7">

          <div className="flex flex-col justify-between gap-6 2xl:flex-row">


            {/* PATIENT */}

            <div className="flex items-center gap-5">

              <button type="button" onClick={() => avatarInputRef.current?.click()} title="Upload profile photo" className="group relative flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#dff3e5] text-2xl font-bold text-[#25854d] shadow-[0_8px_20px_rgba(31,105,59,0.12)]">
                {patient.profileImage ? <img src={patient.profileImage} alt="Patient" className="h-full w-full object-cover" /> : patient.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#25854d] text-white"><Camera size={14} /></span>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />


              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#25854d]">Patient overview</p>
                <h2 className="mt-1 text-[25px] font-bold tracking-tight text-[#183a28]">

                  Welcome back,{" "}

                  {patient.name}

                </h2>


                <div className="mt-3 flex flex-wrap gap-6 lg:gap-9">

                  <PatientInfo
                    label="Patient ID"
                    value={
                      patient.patientId
                    }
                  />

                  <PatientInfo
                    label="Age / Gender"
                    value={`${patient.age} Y / ${patient.gender}`}
                  />

                  <PatientInfo
                    label="Blood Group"
                    value={
                      patient.bloodGroup
                    }
                  />

                  <PatientInfo
                    label="Phone"
                    value={
                      patient.phone
                    }
                  />

                </div>


                <div className="mt-3 flex flex-wrap gap-2">

                  <Tag>

                    Height:{" "}

                    {patient.height
                      ? formatHeight(patient.height)
                      : "—"}

                  </Tag>


                  <Tag>

                    Weight:{" "}

                    {patient.weight
                      ? `${patient.weight} kg`
                      : "—"}

                  </Tag>


                  <Tag>

                    BMI:{" "}

                    <span className="font-bold text-[#159447]">

                      {bmi
                        ? `${bmi} (${bmiStatus})`
                        : "Not available"}

                    </span>

                  </Tag>

                </div>

              </div>

            </div>


            {/* HEALTH SCORE */}

              <div className="w-full rounded-2xl border border-[#d5ebdc] bg-white/80 p-4 shadow-sm 2xl:w-[235px]">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f7ed] text-[#159447]">

                  <Activity size={24} />

                </div>


                <div className="flex-1">

                  <p className="text-[12px] text-gray-500">

                    Health Score

                  </p>


                  <div className="flex items-end gap-1">

                    <strong className="text-[29px] font-bold">

                      {healthScore}

                    </strong>

                    <span className="mb-1 text-[12px] text-gray-400">

                      /100

                    </span>

                  </div>

                </div>


                <span className="text-[12px] font-semibold text-[#159447]">

                  {healthScore >= 80
                    ? "Good"
                    : healthScore >= 60
                    ? "Fair"
                    : "Needs Attention"}

                </span>

              </div>


              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

                <div
                  className="h-full rounded-full bg-[#159447] transition-all duration-500"
                  style={{
                    width:
                      `${healthScore}%`,
                  }}
                />

              </div>


              <p className="mt-2 text-[11px] text-gray-500">

                {healthScore >= 80
                  ? "Your profile and recent records are looking healthy."
                  : "Complete your profile and review your recent health records."}

              </p>

            </div>


            {/* CONDITIONS */}

              <div className="w-full rounded-2xl border border-[#cfe9d6] bg-gradient-to-br from-[#f8fff9] to-[#eaf7ed] p-4 shadow-sm 2xl:w-[210px]">

              <MiniMetric
                icon={
                  <Heart size={19} />
                }
                title="Active Conditions"
                value={
                  conditions.length
                }
                subtitle="Managed"
              />


              <div className="my-3 h-px bg-[#d9eddd]" />


              <MiniMetric
                icon={
                  <Pill size={19} />
                }
                title="Total Medications"
                value={
                  medications.length
                }
                subtitle="Active"
              />

            </div>

          </div>

        </section>


        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.45fr_1fr]">


          {/* ==================================================
              LEFT
          ================================================== */}

          <div className="space-y-4">


            {/* HEALTH GLANCE */}

            <DashboardCard>

              <CardHeading
                icon={
                  <LineChart size={17} />
                }
                title="Health At a Glance"
              />


              <div className="mt-4 grid grid-cols-3 gap-2">

                <StatCard
                  title="Recent Labs"
                  value={
                    labs.length
                  }
                  subtitle="Available"
                  icon={TestTube2}
                />

                <StatCard
                  title="Active Conditions"
                  value={
                    conditions.length
                  }
                  subtitle="Managed"
                  icon={Heart}
                />

                <StatCard
                  title="Medications"
                  value={
                    medications.length
                  }
                  subtitle="Active"
                  icon={Pill}
                />

                <StatCard
                  title="Upcoming Tests"
                  value={
                    appointments.filter(
                      (a) =>
                        String(
                          a.type || ""
                        ).toLowerCase() ===
                        "test"
                    ).length
                  }
                  subtitle="Due Soon"
                  icon={TestTube2}
                />

                <StatCard
                  title="Appointments"
                  value={
                    appointments.length
                  }
                  subtitle="Scheduled"
                  icon={CalendarDays}
                />

                <StatCard
                  title="Critical Alerts"
                  value={
                    alerts.filter(
                      (a) =>
                        a.type === "red"
                    ).length
                  }
                  subtitle="Right Now"
                  icon={AlertTriangle}
                />

              </div>

            </DashboardCard>


            {/* INSIGHTS */}

            <DashboardCard className="relative overflow-hidden">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-[15px] font-semibold text-[#16833d]">

                    Health Insights

                  </h3>


                  <p className="mt-3 max-w-[280px] text-[12px] leading-5 text-gray-600">

                    {labs.length > 0
                      ? "Your recent lab records are available for review."
                      : "Add your lab results to receive personalized health insights."}

                  </p>


                  <button className="mt-4 flex items-center gap-1 rounded-lg border border-[#d9eadc] bg-white px-3 py-2 text-[11px] font-semibold text-[#159447] transition hover:bg-[#f1faf3]">

                    View Detailed Insights

                    <ChevronRight
                      size={14}
                    />

                  </button>

                </div>


                {/* GRAPH DECORATION */}

                <div className="relative mr-3 hidden h-24 w-28 sm:block">

                  <div className="absolute bottom-2 left-2 h-12 w-4 rounded-t bg-[#bce6c9]" />

                  <div className="absolute bottom-2 left-8 h-20 w-4 rounded-t bg-[#72ce8c]" />

                  <div className="absolute bottom-2 left-14 h-14 w-4 rounded-t bg-[#35ae5d]" />

                  <div className="absolute right-1 top-2 h-14 w-14 rounded-full border-[9px] border-[#159447] border-r-transparent" />

                  <Leaf
                    size={25}
                    className="absolute right-0 top-0 text-[#b8e4c3]"
                  />

                </div>

              </div>

            </DashboardCard>

          </div>


          {/* ==================================================
              CENTER
          ================================================== */}

          <DashboardCard className="min-w-0">

            <div className="flex items-center justify-between gap-3">

              <CardHeading
                icon={
                  <Heart size={17} />
                }
                title="Lab Trends Overview"
              />


              <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600 outline-none">

                <option>
                  Last 6 Months
                </option>

                <option>
                  Last 1 Year
                </option>

              </select>

            </div>


            {/* LAB TABS */}

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">

              {Object.keys(
                labTypes
              ).map((type) => (

                <LabTab
                  key={type}
                  active={
                    selectedLab ===
                    type
                  }
                  onClick={() =>
                    setSelectedLab(type)
                  }
                >

                  {type}

                </LabTab>

              ))}

            </div>


            {/* CHART */}

            <div className="mt-3 h-[230px] w-full">

              {labData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={labData}
                  >

                    <defs>

                      <linearGradient
                        id="meridianGreen"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >

                        <stop
                          offset="0%"
                          stopColor="#159447"
                          stopOpacity={0.2}
                        />

                        <stop
                          offset="100%"
                          stopColor="#159447"
                          stopOpacity={0.01}
                        />

                      </linearGradient>

                    </defs>


                    <CartesianGrid
                      stroke="#edf1ee"
                      strokeDasharray="3 3"
                      vertical={false}
                    />


                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: "#737b76",
                      }}
                    />


                    <YAxis
                      domain={
                        currentLabConfig.domain
                      }
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: "#737b76",
                      }}
                    />


                    <Tooltip
                      formatter={(value) =>
                        [
                          `${value} ${currentLabConfig.unit}`,
                          selectedLab,
                        ]
                      }
                    />


                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#159447"
                      strokeWidth={2.5}
                      fill="url(#meridianGreen)"
                      dot={{
                        r: 4,
                        fill: "#159447",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex h-full items-center justify-center rounded-xl bg-[#fbfdfb]">

                  <div className="text-center">

                    <TestTube2
                      size={30}
                      className="mx-auto text-[#b9dec2]"
                    />

                    <p className="mt-3 text-[11px] font-medium text-gray-500">

                      No {selectedLab} data available

                    </p>

                    <p className="mt-1 text-[9px] text-gray-400">

                      Add lab results to see trends.

                    </p>

                  </div>

                </div>

              )}

            </div>


            {/* SUMMARY */}

            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200">

              <LabSummary
                label={`Latest ${selectedLab}`}
                value={
                  latestLab
                    ? `${latestLab.value} ${currentLabConfig.unit}`
                    : "—"
                }
                sub={
                  latestLab
                    ? latestLab.month
                    : "No data"
                }
              />


              <LabSummary
                label="Change"
                value={
                  labChange !== null
                    ? `${Number(labChange) > 0 ? "+" : ""}${labChange}`
                    : "—"
                }
                sub={
                  previousLab
                    ? "vs previous result"
                    : "Add more lab records"
                }
              />


              <LabSummary
                label="Interpretation"
                value={
                  latestLab
                    ? selectedLab ===
                        "HbA1c (%)"
                      ? latestLab.value >
                        6.5
                        ? "Above target"
                        : "Within target"
                      : "Recorded"
                    : "No data"
                }
                valueClass={
                  latestLab &&
                  selectedLab ===
                    "HbA1c (%)" &&
                  latestLab.value >
                    6.5
                    ? "text-orange-500"
                    : "text-[#159447]"
                }
              />

            </div>


            {/* RECOMMENDATION */}

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#d9eddd] bg-[#f4fbf6] px-3 py-2.5 text-[11px] text-[#3c6247]">

              <Leaf
                size={16}
                className="shrink-0 text-[#159447]"
              />

              <span>

                <b className="text-[#16833d]">

                  Recommendation:

                </b>{" "}

                {latestLab &&
                selectedLab ===
                  "HbA1c (%)" &&
                latestLab.value >
                  6.5
                  ? "Please follow your doctor's advice and maintain regular monitoring."
                  : latestLab
                  ? "Continue monitoring your health records regularly."
                  : "Add your health records to receive personalized recommendations."}

              </span>

            </div>

          </DashboardCard>

          {/* ==================================================
              RIGHT
          ================================================== */}

          <div className="space-y-4">


            <DashboardCard>

              <CardHeading
                icon={<FileText size={17} />}
                title="Recent Uploads"
              />

              <div className="mt-4 flex items-center justify-between">

                <h4 className="text-[11px] font-bold text-gray-700">

                  Recent Uploads

                </h4>


                <button type="button" onClick={() => navigate("/patient/reports")} className="text-[10px] font-semibold text-[#159447]">

                  View All

                </button>

              </div>


              <div className="mt-2 divide-y divide-[#edf3ee] overflow-hidden rounded-xl border border-[#edf3ee]">

                {recentReports.length > 0 ? (

                  recentReports
                    .map(
                      (report) => (

                        <UploadedFile
                          key={report._id || report.id || report.reportId}
                          icon={
                            report.type?.includes(
                              "image"
                            )
                              ? <FileImage />
                              : <FileText />
                          }
                          iconClassName={report.type?.includes("image") ? "bg-[#edf8f0] text-[#43a965]" : "bg-[#fff2ed] text-[#e6754d]"}
                          name={
                            report.name ||
                            report.fileName ||
                            "Health Report"
                          }
                          details={formatUploadDateTime(report.date || report.createdAt)}
                          onDownload={() => handleDownloadReport(report)}
                          onDelete={() => handleDeleteReport(report)}
                        />

                      )
                    )

                ) : (

                  <p className="px-2 py-3 text-center text-[9px] text-gray-400">

                    No reports uploaded yet.

                  </p>

                )}

              </div>

            </DashboardCard>


            {/* QUICK ACTIONS */}

            <DashboardCard>

              <CardHeading
                title="Quick Actions"
              />


              <div className="mt-3 grid grid-cols-2 gap-2">

                <QuickAction
                  icon={
                    <CalendarDays />
                  }
                  label="Book Appointment"
                />

                <QuickAction
                  icon={
                    <ClipboardList />
                  }
                  label="View Prescriptions"
                />

                <QuickAction
                  icon={
                    <Share2 />
                  }
                  label="Share Records"
                />

                <QuickAction
                  icon={
                    <Download />
                  }
                  label="Download Summary"
                />

              </div>

            </DashboardCard>

          </div>

        </section>


        {/* ====================================================
            BOTTOM
        ==================================================== */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.7fr]">


          {/* NEED HELP */}

          <DashboardCard>

            <div className="flex gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eaf8ee] text-[#159447]">

                <HelpCircle
                  size={27}
                />

              </div>


              <div>

                <h3 className="text-[14px] font-semibold">

                  Need Help?

                </h3>


                <p className="mt-2 text-[11px] leading-5 text-gray-500">

                  Our support team is here
                  to assist you with any
                  queries or issues.

                </p>


                <button
                  type="button"
                  onClick={() => navigate("/patient/assistant")}
                  className="mt-3 flex items-center gap-1 rounded-lg border border-[#d5ead9] px-3 py-2 text-[10px] font-semibold text-[#159447] hover:bg-[#f2faf4]"
                >

                  Contact Support

                  <ChevronRight
                    size={13}
                  />

                </button>

              </div>

            </div>

          </DashboardCard>


          {/* MONTHLY SUMMARY */}

          <DashboardCard>

            <h3 className="text-[14px] font-semibold">

              Monthly Health Summary

            </h3>


            <div className="mt-4 flex items-center gap-6">

              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-[#159447] border-r-[#dff0e3]">

                <div className="text-center">

                  <strong className="block text-[15px] text-[#159447]">

                    {labs.length > 0
                      ? "Good"
                      : "No Data"}

                  </strong>

                  <span className="text-[9px] text-gray-400">

                    Status

                  </span>

                </div>

              </div>


              <div className="space-y-3 text-[11px]">

                <SummaryItem
                  color="bg-[#159447]"
                  label="Normal"
                  value={
                    normalLabs
                  }
                />

                <SummaryItem
                  color="bg-orange-400"
                  label="Abnormal"
                  value={
                    abnormalLabs
                  }
                />

                <SummaryItem
                  color="bg-red-500"
                  label="Critical"
                  value={
                    criticalLabs
                  }
                />

              </div>

            </div>


            <p className="mt-3 text-[9px] text-gray-400">

              Based on your recent lab results

            </p>

          </DashboardCard>


          {/* RISK */}

          <DashboardCard>

            <div className="flex items-center justify-between">

              <h3 className="text-[14px] font-semibold">

                Risk & Safety Alerts

              </h3>


              <button className="text-[10px] font-semibold text-[#159447]">

                View All

              </button>

            </div>


            <div className="mt-2 divide-y divide-gray-100">

              {alerts.length > 0 ? (

                alerts
                  .slice(-3)
                  .reverse()
                  .map(
                    (alert) => (

                      <RiskAlert
                        key={
                          alert.id
                        }
                        type={
                          alert.type ||
                          "yellow"
                        }
                        title={
                          alert.title ||
                          "Health Alert"
                        }
                        description={
                          alert.description ||
                          "Please review this alert."
                        }
                        date={
                          alert.date ||
                          "Recent"
                        }
                      />

                    )
                  )

              ) : (

                <div className="py-5 text-center">

                  <ShieldCheck
                    size={24}
                    className="mx-auto text-[#159447]"
                  />

                  <p className="mt-2 text-[10px] text-gray-500">

                    No active safety alerts.

                  </p>

                </div>

              )}

            </div>

          </DashboardCard>

        </section>

      </main>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-2 border-t border-gray-200 bg-white px-6 py-3">

        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 text-[10px] text-gray-400">

          <ShieldCheck
            size={13}
            className="text-[#159447]"
          />

          <span>
            Your data is secure & encrypted
          </span>

          <span>
            •
          </span>

          <span>
            MERIDIAN follows HIPAA compliant practices
          </span>

          <span className="ml-auto">

            © 2025 MERIDIAN Health Systems

          </span>

        </div>

      </footer>

    </div>

  );
}


/* ============================================================
   PATIENT INFO
============================================================ */

function PatientInfo({
  label,
  value,
}) {

  return (

    <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#7a9683]">

        {label}

      </p>


                  <p className="mt-1 text-[12px] font-semibold text-[#315343]">

        {value || "—"}

      </p>

    </div>

  );

}


/* ============================================================
   TAG
============================================================ */

function Tag({
  children,
}) {

  return (

    <span className="rounded-full border border-[#d4ead9] bg-[#f1faf3] px-3 py-1 text-[9px] font-semibold text-[#4d765c]">

      {children}

    </span>

  );

}


/* ============================================================
   MINI METRIC
============================================================ */

function MiniMetric({
  icon,
  title,
  value,
  subtitle,
}) {

  return (

    <div className="flex items-center gap-3">

      <div className="text-[#159447]">

        {icon}

      </div>


      <div>

        <p className="text-[10px] text-gray-600">

          {title}

        </p>


        <div className="flex items-baseline gap-2">

          <strong className="text-[20px]">

            {value}

          </strong>

          <span className="text-[9px] text-[#159447]">

            {subtitle}

          </span>

        </div>

      </div>

    </div>

  );

}


/* ============================================================
   DASHBOARD CARD
============================================================ */

function DashboardCard({
  children,
  className = "",
}) {

  return (

    <div
      className={`rounded-2xl border border-[#dcece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] ${className}`}
    >

      {children}

    </div>

  );

}


/* ============================================================
   CARD HEADING
============================================================ */

function CardHeading({
  icon,
  title,
}) {

  return (

    <div className="flex items-center gap-2">

      {icon && (

        <span className="text-[#159447]">

          {icon}

        </span>

      )}


      <h3 className="text-[14px] font-bold text-[#244b35]">

        {title}

      </h3>

    </div>

  );

}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}) {

  return (

    <div className="group flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-[#e1eee4] bg-[#f9fdf9] px-2 py-3 text-center transition hover:-translate-y-0.5 hover:border-[#b9ddc2] hover:bg-[#f1faf3]">

      <Icon
        size={19}
        className="text-[#159447]"
        strokeWidth={1.8}
      />


      <strong className="mt-2 text-[18px] text-[#183a28]">

        {value}

      </strong>


      <span className="mt-0.5 text-[10px] font-bold text-[#315343]">

        {title}

      </span>


      <small className="mt-0.5 text-[8px] text-gray-400">

        {subtitle}

      </small>

    </div>

  );

}


/* ============================================================
   LAB TAB
============================================================ */

function LabTab({
  children,
  active = false,
  onClick,
}) {

  return (

    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-medium transition ${
        active
          ? "bg-[#159447] text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-600 hover:border-[#b9ddc2] hover:text-[#159447]"
      }`}
    >

      {children}

    </button>

  );

}


/* ============================================================
   LAB SUMMARY
============================================================ */

function LabSummary({
  label,
  value,
  sub,
  valueClass = "",
}) {

  return (

    <div className="border-r border-gray-100 px-4 py-3 last:border-0">

      <p className="text-[10px] font-medium text-[#159447]">

        {label}

      </p>


      <strong
        className={`mt-1 block text-[18px] font-semibold ${valueClass}`}
      >

        {value}

      </strong>


      {sub && (

        <span className="text-[9px] text-gray-400">

          {sub}

        </span>

      )}

    </div>

  );

}


/* ============================================================
   UPLOADED FILE
============================================================ */

function UploadedFile({
  icon,
  name,
  details,
  iconClassName = "text-[#159447] bg-[#f0f8f2]",
  onDownload,
  onDelete,
}) {

  return (

    <div className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-[#f7faf8]">

      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>

        {React.cloneElement(
          icon,
          {
            size: 16,
          }
        )}

      </div>


      <div className="min-w-0 flex-1">

        <p className="truncate text-[10px] font-semibold text-gray-700">

          {name}

        </p>


        <p className="mt-0.5 text-[8px] text-gray-400">

          {details}

        </p>

      </div>


      <div className="flex items-center gap-1">
        <button type="button" onClick={onDownload} title="Download report" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#159447] transition hover:bg-[#edf8f0]"><Download size={14} /></button>
        <button type="button" onClick={onDelete} title="Delete report" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#c96a61] transition hover:bg-[#fff1ef]"><Trash2 size={14} /></button>
      </div>

    </div>

  );

}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon,
  label,
}) {

  return (

    <button
      type="button"
      className="flex items-center gap-2 rounded-xl border border-[#e3eee5] bg-[#f8fcf9] px-3 py-3 text-left text-[10px] font-semibold text-gray-700 transition hover:border-[#b8ddc0] hover:bg-[#eef9f1] hover:text-[#159447]"
    >

      {React.cloneElement(
        icon,
        {
          size: 17,
          className:
            "text-[#159447]",
        }
      )}

      {label}

    </button>

  );

}


/* ============================================================
   SUMMARY ITEM
============================================================ */

function SummaryItem({
  color,
  label,
  value,
}) {

  return (

    <div className="flex items-center gap-2">

      <span
        className={`h-2 w-2 rounded-full ${color}`}
      />


      <span className="w-16 text-gray-600">

        {label}

      </span>


      <strong>

        {value}

      </strong>

    </div>

  );

}


/* ============================================================
   RISK ALERT
============================================================ */

function RiskAlert({
  type,
  title,
  description,
  date,
}) {

  const colors = {

    red:
      "bg-red-50 text-red-500",

    orange:
      "bg-orange-50 text-orange-500",

    yellow:
      "bg-yellow-50 text-yellow-500",

  };


  return (

    <div className="flex items-center gap-3 py-2.5">

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          colors[type] ||
          colors.yellow
        }`}
      >

        <AlertTriangle
          size={15}
        />

      </div>


      <div className="min-w-0 flex-1">

        <p className="text-[10px] font-semibold text-gray-700">

          {title}

        </p>


        <p className="truncate text-[9px] text-gray-500">

          {description}

        </p>

      </div>


      <span className="whitespace-nowrap text-[8px] text-gray-400">

        {date}

      </span>

    </div>

  );

}