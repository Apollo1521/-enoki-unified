import {
  Users,
  UserCheck,
  UserX,
  Phone,
  TrendingUp,
  LayoutDashboard,
  IdCard,
  ArrowRight,
} from "lucide-react";
import { Inter, Poppins, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/middlewares/secureEnokiGate";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import TimeAgoComponent from "@/components/TimeAgo";
import { use, useCallback, useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { useRfidSocket } from "@/utils/useRfidSocket";
import moment from "moment";
import Head from "next/head";

interface StudentCall {
  teacher: {
    enokiAcct: {
      name: string;
    };
    department: any;
  };
  student: {
    enokiAcct: {
      name: string;
    };
    course: any;
  };
  calledAt: string;
  id: string;
  callType: any;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const getStatusBackground = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "text-green-700 bg-green-100";
    case "IN_CLASS":
      return "text-green-700 bg-green-100";
    case "IN_BREAK":
      return "text-green-700 bg-green-100";
    case "IN_BUSY":
      return "text-green-700 bg-green-100";
    case "OUT":
      return "text-red-700 bg-red-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-500";
    case "IN_CLASS":
      return "bg-green-500";
    case "IN_BREAK":
      return "bg-green-500";
    case "IN_BUSY":
      return "bg-green-500";
    case "OUT":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "In";
    case "IN_CLASS":
      return "In";
    case "IN_BUSY":
      return "In";
    case "IN_BREAK":
      return "In";
    case "OUT":
      return "Out";
    default:
      return "Unknown";
  }
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await authGate(ctx);
}

export default function Home({ user }: { user: any }) {
  const router = useRouter();

  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;

  const [todayStats, setTodayStats] = useState({
    in: 0,
    out: 0,
  });

  const handleTeacherClick = (teacherId: number) => {
    router.push(`/`);
  };
  const {
    data: facultyData = [],
    isFetched: facultyFetched,
    isPending: facultyPending,
    isError: facultyError,
    isFetching: facultyFetching,
    isRefetching: facultyRefetching,
    refetch: facultyRefetch,
  } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API}/get-teachers`,
        {
          params: {
            institutionId: __userData.institutionId,
          },
        }
      );

      return res.data.data;
    },
    enabled: !!__userData.userId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    data: studentCalls = [],
    isPending: studentCallsPending,
    isError: studentCallsError,
    refetch: studentCallsRefetch,
  } = useQuery({
    queryKey: ["studentCalls"],
    queryFn: async () => {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/get-student-calls`,
        {
          institutionId: __userData.institutionId,
        }
      );

      return res.data.calls;
    },
    enabled: !!__userData.userId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (facultyData.length === 0) return;
    const todayStats = {
      in: facultyData.filter((teacher: any) =>
        ["AVAILABLE", "IN_BUSY", "IN_CLASS", "IN_BREAK"].includes(
          teacher.statistics.status
        )
      ).length,
      out: facultyData.filter(
        (teacher: any) => teacher.statistics.status === "OUT"
      ).length,
    };
    setTodayStats(todayStats);
  }, [facultyData]);

  const { rfidData } = useRfidSocket({
    enabled: true,
    onRfidData: (data) => {
      if (!["DSH-MESSAGE", "MESSAGE-SENT"].includes(data.type)) return;
      facultyRefetch();
      studentCallsRefetch();
    },
    playSound: true,
    soundFile: "notification.mp3",
  });

  const downloadCallsheet = useCallback(async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/export-callsheet`,
        { institutionId: user.institutionId },
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student-calls.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {}
  }, [user.institutionId]);

  return (
    <>
      <Head>
        <title>E-Noki - Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className={`${poppins.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}
      >
        <div className="flex">
          <Sidebar userData={__userData} />
          <div className="main-panel flex-1">
            <header
              className={`${inter.className} p-5 z-[99] bg-blue-600 text-white w-full sticky top-0 z-10 flex gap-5 items-center`}
            >
              <div>
                <LayoutDashboard size="30" strokeWidth={1.2} />
              </div>
              <div>
                <h1 className="font-[600] text-white text-sm">Dashboard</h1>
                <p className="font-[400] text-white/70 text-xs">
                  Real-time insights and system management
                </p>
              </div>
            </header>
            <div className="grid grid-cols-3 grid-rows-[300px_500px] gap-4 px-5 p-5">
              <div className="col-span-2 row-span-1 rounded-2xl statistics p-8 bg-white border border-white/20">
                {facultyPending && (
                  <div className="h-full grid place-items-center">
                    <CircularProgress sx={{ color: "#0000ff" }} />
                  </div>
                )}
                {!facultyPending &&
                  facultyData.length !== 0 &&
                  !facultyError && (
                    <>
                      <div className="h-full flex flex-col">
                        <h2
                          className={`${spaceGrotesk.className} font-bold text-2xl flex gap-3 items-center text-slate-800 mb-8 tracking-tight`}
                        >
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <TrendingUp size="22" className="text-white" />
                          </div>
                          Analytics Overview
                        </h2>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-5 mb-8">
                          <div className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent p-6 rounded-2xl border border-green-200/50 ">
                            <div className="flex items-center justify-between">
                              <div>
                                <p
                                  className={`${spaceGrotesk.className} text-3xl font-black text-green-700 mb-1`}
                                >
                                  {todayStats.in}
                                </p>
                                <p className="text-sm text-green-600/80 font-semibold tracking-wide">
                                  In
                                </p>
                              </div>
                              <div className="p-3 bg-green-500/10 rounded-xl">
                                <UserCheck
                                  className="text-green-600"
                                  size="28"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent p-6 rounded-2xl border border-red-200/50 ">
                            <div className="flex items-center justify-between">
                              <div>
                                <p
                                  className={`${spaceGrotesk.className} text-3xl font-black text-red-700 mb-1`}
                                >
                                  {todayStats.out}
                                </p>
                                <p className="text-sm text-red-600/80 font-semibold tracking-wide">
                                  Out
                                </p>
                              </div>
                              <div className="p-3 bg-red-500/10 rounded-xl">
                                <UserX className="text-red-600" size="28" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Historical Chart */}
                      </div>
                    </>
                  )}
              </div>
              <div className="col-span-1 row-span-2 bg-white border border-neutral-200 rounded-xl teacher-statuses p-6">
                {facultyPending && (
                  <div className="h-full grid place-items-center">
                    <CircularProgress sx={{ color: "#0000ff" }} />
                  </div>
                )}
                {!facultyPending &&
                  facultyData.length !== 0 &&
                  !facultyError && (
                    <>
                      <div className="h-full overflow-y-scroll">
                        <div className="sticky top-0 z-10 bg-white pb-1">
                          <h2
                            className={`${spaceGrotesk.className} font-[700] text-lg text-gray-800 mb-6 flex items-center gap-2`}
                          >
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                              <Users size="15" className="text-white" />
                            </div>{" "}
                            Teacher Status
                          </h2>
                        </div>

                        <div className="space-y-3">
                          {facultyData
                            .sort((a: any, b: any) => {
                              const aTime = new Date(a.statistics.updatedAt);
                              const bTime = new Date(b.statistics.updatedAt);
                              return bTime.getTime() - aTime.getTime();
                            })
                            .map((teacher: any, index: any) => (
                              <div
                                key={teacher.id}
                                className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                                onClick={() => handleTeacherClick(teacher.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {teacher.name
                                          .split(" ")
                                          .map((n: any) => n[0])
                                          .filter(
                                            (_: any, i: any, arr: any) =>
                                              i < 2 || i === arr.length - 1
                                          )
                                          .join("")}
                                      </div>
                                      <div
                                        className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                                          teacher.statistics.status
                                        )} rounded-full border-2 border-white`}
                                      ></div>
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-800 text-sm">
                                        {teacher.name}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate w-[130px]">
                                        {teacher.department?.name ||
                                          "Department missing."}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        <TimeAgoComponent
                                          timestamp={
                                            teacher.statistics.updatedAt
                                          }
                                        />
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBackground(
                                        teacher.statistics.status
                                      )}`}
                                    >
                                      {getStatusText(teacher.statistics.status)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
              </div>

              {/* Recent Activity Panel */}
              <div className="col-span-2 bg-white border border-neutral-200 rounded-xl call-graph p-6">
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6 ">
                    <h2
                      className={`${spaceGrotesk.className} font-[700] text-lg text-gray-800 flex items-center gap-2`}
                    >
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                        <IdCard size="15" className="text-white" />
                      </div>{" "}
                      Recent Kiosk Student Scans
                    </h2>
                    <button
                      onClick={() => downloadCallsheet()}
                      className="bg-blue-600 text-white px-5 py-1 font-[500] rounded-full"
                    >
                      Export All Data
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4">
                    {studentCallsPending && (
                      <div className="h-32 grid place-items-center">
                        <CircularProgress sx={{ color: "#0000ff" }} />
                      </div>
                    )}

                    {!studentCallsPending && studentCalls.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Phone size="32" className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent student calls</p>
                      </div>
                    )}

                    {!studentCallsPending && studentCalls.length > 0 && (
                      <div className="space-y-3">
                        {(studentCalls as StudentCall[])
                          .sort(
                            (a, b) =>
                              new Date(b.calledAt).getTime() -
                              new Date(a.calledAt).getTime()
                          )
                          .slice(0, 10)
                          .map((call) => (
                            <div
                              key={call.id}
                              className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition-all duration-200 border border-gray-200"
                            >
                              <div className="flex items-center justify-between w-full">
                                {/* Left side (student → teacher) */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  {/* Student */}
                                  <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[20%]">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs">
                                      {call.student.enokiAcct.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                      <span className="text-sm font-medium truncate text-gray-700">
                                        {call.student.enokiAcct.name}
                                      </span>
                                      <span className="text-xs font-thin truncate text-gray-700">
                                        {call.student.course.name}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Arrow */}
                                  <ArrowRight
                                    size="16"
                                    className="text-gray-400 flex-shrink-0"
                                  />

                                  {/* Teacher */}
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs">
                                      {call.teacher.enokiAcct.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-sm font-medium truncate text-gray-700">
                                        {call.teacher.enokiAcct.name}
                                      </span>
                                      <span className="text-xs font-thin truncate text-gray-700">
                                        {call.teacher.department.name}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Timestamp */}
                                <div className="text-xs text-gray-500 flex flex-col items-end flex-shrink-0 ml-4">
                                  <span className="font-semibold">
                                    {moment(call.calledAt).format("hh:mm:ss A")}
                                  </span>
                                  <span>{call.callType}</span>
                                  {call.callType === "NOTIFY" && (
                                    <span>{call.attended ? "Yes" : "No"}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
