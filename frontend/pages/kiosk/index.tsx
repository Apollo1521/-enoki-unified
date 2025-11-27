import { authGate } from "@/middlewares/secureEnokiGate";
import { isUserDataComplete, selectUserData } from "@/redux/features/userSlice";
import { GetServerSideProps } from "next";
import { Inter } from "next/font/google";
import { useSelector } from "react-redux";
import { GetServerSidePropsContext } from "next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronRight,
  User,
  Circle,
  MessageSquare,
  Mail,
  CreditCard,
  Building2,
  X,
  Search,
  Bell,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import SendMessage from "@/components/SendMessage";
import NotifyTeacher from "@/components/NotifyTeacher";
import TeacherConfirmModal from "@/components/TeacherConfirmModal";
import { AnimatePresence } from "framer-motion";
import { useEnokiMutator } from "@/hooks/useEnokiMutator";
import { useRfidSocket } from "@/utils/useRfidSocket";
import moment from "moment";
import Head from "next/head";
import { useKeyboard } from "@/contexts/KeyboardContext";

const getStatusBackground = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "text-green-700 bg-green-100";
    case "IN_CLASS":
      return "text-blue-700 bg-blue-100";
    case "IN_BREAK":
      return "text-yellow-700 bg-yellow-100";
    case "IN_BUSY":
      return "text-red-700 bg-red-100";
    case "OUT":
      return "text-gray-700 bg-gray-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-500";
    case "IN_CLASS":
      return "bg-blue-500";
    case "IN_BREAK":
      return "bg-yellow-500";
    case "IN_BUSY":
      return "bg-red-500";
    case "OUT":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "IN_CLASS":
      return "In Class";
    case "IN_BUSY":
      return "In (Busy)";
    case "IN_BREAK":
      return "In (Break)";
    case "OUT":
      return "Out";
    default:
      return "Unknown";
  }
};

const inter = Inter({ subsets: ["latin"] });

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const auth = await authGate(ctx);
  return auth;
}

export default function Kiosk({ user }: { user: any }) {
  const { initKeyboard } = useKeyboard();

  const queryClient = useQueryClient();
  const { logout } = useEnokiMutator();
  const userData = useSelector(selectUserData);
  const __userData = isUserDataComplete(userData) ? userData : user;
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTeacher, setStatusModalTeacher] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalTeacher, setConfirmModalTeacher] = useState<any>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTeacher, setNotifyTeacher] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showKioskActionsModal, setShowKioskActionsModal] = useState(false);

  // Long press functionality
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);

  const handleLongPressStart = useCallback(() => {
    isLongPressing.current = true;
    longPressTimer.current = setTimeout(() => {
      if (isLongPressing.current) {
        setShowKioskActionsModal(true);
      }
    }, 10000); // 40 seconds
  }, []);

  const handleLongPressEnd = useCallback(() => {
    isLongPressing.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const {
    data: departmentsData = [],
    isFetched: departmentsFetched,
    isPending: departmentsPending,
    isError: departmentsError,
    isFetching: departmentsFetching,
    isRefetching: departmentsRefetching,
    refetch: departmentRefetch,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API}/get-departments`,
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

  // Query for all teachers (for search functionality)
  const {
    data: allTeachersData = [],
    isPending: allTeachersPending,
    isError: allTeachersError,
    refetch: allTeachersRefetch,
  } = useQuery({
    queryKey: ["all-teachers"],
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Query for department-specific teachers
  const {
    data: teachersData = [],
    isPending: teachersPending,
    isError: teachersError,
    refetch: teacherRefetch,
  } = useQuery({
    queryKey: ["teachers", selectedDepartmentId],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API}/get-teachers`,
        {
          params: {
            departmentId: selectedDepartmentId,
            institutionId: __userData.institutionId,
          },
        }
      );

      return res.data.data;
    },
    enabled: !!selectedDepartmentId,
    staleTime: 5 * 60 * 1000,
  });

  const handleSendMessage = (teacher: any) => {
    const status = teacher.statistics?.status || teacher.status;

    if (status === "IN_BUSY" || status === "IN_BREAK") {
      setStatusModalTeacher(teacher);
      setShowStatusModal(true);
      return;
    }

    if (status === "AVAILABLE") {
      setConfirmModalTeacher(teacher);
      setShowConfirmModal(true);
      return;
    }

    setSelectedTeacher(teacher);
    setShowMessageModal(true);
  };

  const handleCloseModal = () => {
    setShowMessageModal(false);
    setSelectedTeacher(null);
    setMessage("");
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setStatusModalTeacher(null);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalTeacher(null);
  };

  const handleConfirmNotify = () => {
    if (confirmModalTeacher) {
      setNotifyTeacher(confirmModalTeacher);
      setShowNotifyModal(true);
      handleCloseConfirmModal();
    }
  };

  const handleCloseNotifyModal = () => {
    setShowNotifyModal(false);
    setNotifyTeacher(null);
  };

  const formatComebackTime = (cmb: number, updatedAt: string) => {
    const baseTime = moment(updatedAt);
    const comebackTime = baseTime.clone().add(cmb, "seconds");
    return comebackTime.format("MMMM Do | h:mm A ");
  };

  const { rfidData } = useRfidSocket({
    enabled: true,
    onRfidData: (data) => {
      if (data.type !== "STATUS-CHANGE") return;

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["all-teachers"],
        exact: false,
      });
    },
    playSound: false,
    soundFile: "notification.mp3",
  });

  // Filter teachers based on search query
  const filteredTeachers = useMemo(() => {
    // Determine which dataset to use based on search and department selection
    const sourceData = searchQuery.trim()
      ? allTeachersData // Use all teachers when searching
      : teachersData; // Use department-specific teachers when not searching

    if (!searchQuery.trim()) {
      return sourceData;
    }

    return sourceData.filter((teacher: any) => {
      const searchLower = searchQuery.toLowerCase();
      const teacherName = teacher.name?.toLowerCase() || "";
      const departmentName =
        departmentsData
          .find((d: any) => d.id === teacher.departmentId)
          ?.name?.toLowerCase() || "";
      const status = getStatusText(
        teacher.statistics?.status || teacher.status
      ).toLowerCase();
      const room = teacher.room?.toString().toLowerCase() || "";

      return (
        teacherName.includes(searchLower) ||
        departmentName.includes(searchLower) ||
        status.includes(searchLower) ||
        room.includes(searchLower)
      );
    });
  }, [teachersData, allTeachersData, searchQuery, departmentsData]);

  const handleOpenKeyboard = async () => {
    const value = await initKeyboard({
      placeholder: "Search teachers...",
      initialValue: searchQuery,
    });

    setSearchQuery(value);
  };

  return (
    <>
      <Head>
        <title>E-Noki - Kiosk</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className={`${inter.className} bg-yellow-300 h-screen w-screen p-10 flex gap-5`}
      >
        <nav className="w-1/3 h-full overflow-y-auto">
          <div className=" max-w-[300px] rounded mb-5">
            <img
              src="enokiblck.svg"
              alt=""
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
              style={{ userSelect: "none" }}
            />
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchQuery}
              onFocus={() => handleOpenKeyboard()}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <ul className="mt-4 space-y-3">
            {departmentsData.map((department: any) => (
              <li
                key={department.id}
                className={`bg-blue-700 text-yellow-300 px-6 py-4 rounded-xl font-semibold text-lg cursor-pointer hover:bg-blue-800 hover:text-yellow-200 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-between ${
                  selectedDepartmentId === department.id
                    ? "ring-4 ring-yellow-400"
                    : ""
                }`}
                onClick={() => {
                  setSelectedDepartmentId(department.id);
                }}
              >
                <span>{department.name}</span>
                <ChevronRight className="w-6 h-6" />
              </li>
            ))}
          </ul>
        </nav>
        <div className="w-2/3 bg-blue-700 h-full rounded-2xl p-8 overflow-y-auto">
          {!selectedDepartmentId && !searchQuery.trim() ? (
            <div className="flex items-center justify-center h-full text-yellow-300">
              <div className="text-center">
                <User className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">
                  Select a department to view teachers
                </p>
                <p className="text-sm mt-2 opacity-75">
                  Or use the search bar to find teachers across all departments
                </p>
              </div>
            </div>
          ) : (searchQuery.trim() ? allTeachersPending : teachersPending) ? (
            <div className="flex items-center justify-center h-full text-yellow-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-300 mx-auto mb-4"></div>
                <p className="text-xl font-semibold">Loading teachers...</p>
              </div>
            </div>
          ) : (searchQuery.trim() ? allTeachersError : teachersError) ? (
            <div className="flex items-center justify-center h-full text-red-300">
              <div className="text-center">
                <p className="text-xl font-semibold">Error loading teachers</p>
              </div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-yellow-300">
              <div className="text-center">
                <User className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">
                  {searchQuery.trim()
                    ? `No teachers found matching "${searchQuery}"`
                    : "No teachers found in this department"}
                </p>
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-3 text-yellow-200 hover:text-white underline transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-4">
                {filteredTeachers.map((teacher: any) => (
                  <div
                    key={teacher.id}
                    className="bg-yellow-50 rounded-2xl p-6 shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-200 flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {teacher.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .filter(
                                (_: any, i: number, arr: any[]) =>
                                  i < 2 || i === arr.length - 1
                              )
                              .join("")}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                              teacher.statistics?.status || teacher.status
                            )} rounded-full border-2 border-yellow-50`}
                          ></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">
                            {teacher.name}
                          </h3>
                          <p className="text-sm text-blue-600">
                            {departmentsData.find(
                              (d: any) => d.id === teacher.departmentId
                            )?.name || "Department"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBackground(
                          teacher.statistics?.status || teacher.status
                        )}`}
                      >
                        {getStatusText(
                          teacher.statistics?.status || teacher.status
                        )}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {(teacher.statistics?.status === "IN_CLASS" ||
                        teacher.status === "IN_CLASS") &&
                        teacher.room && (
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Building2 size="14" />
                            <span>
                              RM {teacher.room.toString().toUpperCase()}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      {teacher.statistics?.status === "AVAILABLE" && (
                        <button
                          onClick={() => handleSendMessage(teacher)}
                          className="flex-1 bg-blue-700 text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <Bell size="16" />
                          Notify Teacher
                        </button>
                      )}

                      {teacher.statistics?.status === "IN_BUSY" && (
                        <button
                          onClick={() => handleSendMessage(teacher)}
                          className="flex-1 bg-blue-700 text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <AlertCircle size="16" />
                          See Message
                        </button>
                      )}

                      {teacher.statistics?.status === "IN_BREAK" && (
                        <button
                          onClick={() => handleSendMessage(teacher)}
                          className="flex-1 bg-blue-700 text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <AlertCircle size="16" />
                          See Message
                        </button>
                      )}

                      {teacher.statistics?.status === "OUT" && (
                        <button
                          onClick={() => handleSendMessage(teacher)}
                          className="flex-1 bg-blue-700 text-yellow-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <MessageSquare size="16" />
                          Send Message
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Message Modal */}
      <AnimatePresence>
        {showMessageModal && selectedTeacher && (
          <SendMessage
            teacher={selectedTeacher}
            close={handleCloseModal}
            institutionId={__userData.institutionId}
          />
        )}
      </AnimatePresence>

      {/* Teacher Status Modal */}
      <AnimatePresence>
        {showStatusModal && statusModalTeacher && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Teacher Status
                </h2>
                <button
                  onClick={handleCloseStatusModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size="24" />
                </button>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
                    {statusModalTeacher.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .filter(
                        (_: any, i: number, arr: any[]) =>
                          i < 2 || i === arr.length - 1
                      )
                      .join("")}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {statusModalTeacher.name}
                  </h3>
                  <span
                    className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${getStatusBackground(
                      statusModalTeacher.statistics?.status ||
                        statusModalTeacher.status
                    )}`}
                  >
                    {getStatusText(
                      statusModalTeacher.statistics?.status ||
                        statusModalTeacher.status
                    )}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-700 text-lg">
                    This teacher is currently on{" "}
                    <span className="font-semibold">
                      {getStatusText(
                        statusModalTeacher.statistics?.status ||
                          statusModalTeacher.status
                      ).toLowerCase()}
                    </span>
                    , please come back in
                  </p>
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-2xl font-bold text-blue-800">
                      {statusModalTeacher.statistics?.cmb &&
                      statusModalTeacher.statistics?.updatedAt
                        ? formatComebackTime(
                            statusModalTeacher.statistics.cmb,
                            statusModalTeacher.statistics.updatedAt
                          )
                        : "N/A"}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Expected return time
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseStatusModal}
                  className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors duration-200"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Available Teachers */}
      <TeacherConfirmModal
        showConfirmModal={showConfirmModal}
        confirmModalTeacher={confirmModalTeacher}
        handleCloseConfirmModal={handleCloseConfirmModal}
        handleConfirmNotify={handleConfirmNotify}
      />

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotifyModal && notifyTeacher && (
          <NotifyTeacher
            teacher={notifyTeacher}
            institutionId={__userData.institutionId}
            close={handleCloseNotifyModal}
          />
        )}
      </AnimatePresence>

      {/* Kiosk Actions Modal */}
      <AnimatePresence>
        {showKioskActionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  ACTIONS
                </h2>

                <button
                  onClick={() => {
                    logout.mutate();
                    setShowKioskActionsModal(false);
                  }}
                  className="w-full bg-red-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 mb-4"
                >
                  Logout
                </button>

                <button
                  onClick={() => setShowKioskActionsModal(false)}
                  className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
