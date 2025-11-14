import { useAuth } from "@/components/AuthContext";
import { useLoader } from "@/components/UseLoaderContext";
import useEnokiMutator from "@/hooks/useEnokiMutator";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";

type TMRType = "class" | "break";

interface TMR {
  start: string;
  end: string;
  type: TMRType;
}

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
};

export default function Dashboard() {
  const { show: showLoader, hide: hideLoader } = useLoader();
  const { changeStatus } = useEnokiMutator();

  const opacity = useSharedValue(0); // start invisible
  const translateY = useSharedValue(Dimensions.get("window").height);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const translateYStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const { userId, __logout, setCurrentUser } = useAuth();
  const [schedule, setSchedule] = useState<TMR[]>([]);
  const expoRouter = useRouter();
  const [currentStatus, setCurrentStatus] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComebackModal, setShowComebackModal] = useState(false);
  const [comebackHours, setComebackHours] = useState("");
  const [comebackMinutes, setComebackMinutes] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const statusOptions = [
    { label: "Available", color: "bg-emerald-500", vt: "AVAILABLE" },
    { label: "Busy", color: "bg-red-500", vt: "IN_BUSY" },
    { label: "Break", color: "bg-yellow-500", vt: "IN_BREAK" },
    { label: "Class", color: "bg-blue-500", vt: "IN_CLASS" },
    { label: "Out", color: "bg-gray-500", vt: "OUT" },
  ];

  const handleShowStatusModifier = () => {
    setShowMenu(false);
    setShowStatusMenu(true);
  };
  const handleShowMenu = () => {
    setShowMenu(true);
    setShowStatusMenu(false);
    opacity.value = withSpring(1, { duration: 200 });
    translateY.value = withDelay(50, withSpring(0, { duration: 200 }));
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
    setShowStatusMenu(false);
    opacity.value = withSpring(0, { duration: 300 });
    translateY.value = withSpring(Dimensions.get("window").height, {
      duration: 300,
    });
  };

  const handleCancelComeback = () => {
    setShowComebackModal(false);
    setComebackHours("");
    setComebackMinutes("");
    setPendingStatus("");
  };

  const handleConfirmComeback = async () => {
    const hours = Number(comebackHours) || 0;
    const minutes = Number(comebackMinutes) || 0;

    if (hours === 0 && minutes === 0) {
      return; // Don't proceed if both hours and minutes are 0
    }

    const newStat = statusOptions.find((s) => s.label === pendingStatus)?.vt;

    try {
      showLoader();
      await changeStatus.mutateAsync({
        id: userData.teacherId,
        newStatus: newStat!,
        cmb: (hours * 60 + minutes) * 60,
      });
    } catch (e) {
      console.log(e);
    } finally {
      hideLoader();
    }

    setShowComebackModal(false);
    setComebackHours("");
    setComebackMinutes("");
    setPendingStatus("");
  };

  const handleLogout = () => {
    setShowMenu(false);
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    __logout();
    expoRouter.replace("/login");
  };

  const selectStatus = async (status: string) => {
    const newStat = statusOptions.find((s) => s.label === status)?.vt;

    // Check if status requires comeback time
    if (newStat === "IN_BUSY" || newStat === "IN_BREAK") {
      setPendingStatus(status);
      setShowStatusMenu(false);
      setShowComebackModal(true);
      return;
    }

    try {
      showLoader();
      await changeStatus.mutateAsync({
        id: userData.teacherId,
        newStatus: newStat!,
      });
    } catch (e) {
      console.log(e);
    } finally {
      hideLoader();
    }

    setShowStatusMenu(false);
  };

  const getCurrentStatusColor = () => {
    const status = statusOptions.find((s) => s.vt === currentStatus);
    return status?.color || "bg-gray-500";
  };

  const runSetSchedule = (schedule: any) => {
    const __todayIdx = (moment().isoWeekday() - 1) % 7;
    const currentSchedule = schedule[__todayIdx];

    if (currentSchedule.dayOff) {
      setSchedule([]);
      return;
    }

    const cmb = [
      ...currentSchedule.classTimes.map((c: any) => ({
        start: c.cS,
        end: c.cE,
        type: "class",
      })),
      ...currentSchedule.breakTimes.map((b: any) => ({
        start: b.bS,
        end: b.bE,
        type: "break",
      })),
    ];

    // 2. Sort chronologically by start time
    cmb.sort((a, b) => a.start - b.start);

    // 3. Format the times using moment
    const fmx = cmb.map((item) => ({
      type: item.type,
      start: moment()
        .startOf("day")
        .add(item.start, "seconds")
        .format("h:mm A"),
      end: moment().startOf("day").add(item.end, "seconds").format("h:mm A"),
    }));

    setSchedule(fmx);
  };

  const {
    data: userData = null,
    isPending: userDataPending,
    isError: userDataIsError,
    refetch: userDataRefetch,
  } = useQuery({
    queryFn: async () => {
      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/app-get-userdata`,
        { id: userId }
      );
      return res.data.data;
    },
    queryKey: ["user", userId],
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!userData) return;
    setCurrentStatus(userData.teacher.statistics.status);
    runSetSchedule(userData.teacher.schedule);
    setCurrentUser(userData);
  }, [userData]);

  useFocusEffect(
    useCallback(() => {
      userDataRefetch();
    }, [userDataRefetch])
  );

  return (
    <>
      {userDataPending && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="black" />
        </View>
      )}

      {!userDataPending && userDataIsError && (
        <View className="flex-1 justify-center items-center">
          <View>
            <Text className="font-poppins-semibold text-center text-2xl">
              Error
            </Text>
            <Text className="text-center text-slate-500 font-poppins mt-2">
              Server is offline.
            </Text>
          </View>
        </View>
      )}

      {!userDataPending && userData && (
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="pt-9 pb-3 px-6 pb-1">
            <View className="flex flex-row items-center justify-between">
              <View>
                <Text className="text-gray-600 font-poppins text-sm">
                  {getTimeBasedGreeting()},
                </Text>
                <Text
                  className="text-gray-900 font-poppins-semibold text-2xl truncate"
                  numberOfLines={1}
                >
                  {userData?.name || ""}
                </Text>
              </View>
            </View>
          </View>
          <ScrollView
            className="flex-1 px-6 pt-5"
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 mb-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-500 font-poppins text-sm mb-1">
                    Current Status
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-900 font-poppins-semibold text-xl">
                      {statusOptions.find((s) => s.vt === currentStatus)?.label}
                    </Text>
                  </View>
                </View>
                <View
                  className={`${getCurrentStatusColor()} w-4 h-4 rounded-full`}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-gray-900 font-poppins-semibold text-lg mb-4">
                Today's Overview
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                  <Text className="text-blue-600 font-poppins-semibold text-2xl">
                    {
                      schedule.filter((tmr) => {
                        return tmr.type !== "break";
                      }).length
                    }
                  </Text>
                  <Text className="text-gray-600 font-poppins text-sm">
                    Classes
                  </Text>
                </View>
              </View>
            </View>

            {/* Schedule */}
            <View className="mb-6">
              <Text className="text-gray-900 font-poppins-semibold text-lg mb-4">
                Today's Schedule
              </Text>
              <View className="flex flex-col gap-2">
                {schedule.length === 0 ? (
                  <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 items-center justify-center border border-blue-100">
                    <View className="bg-blue-100 rounded-full p-4 mb-4">
                      <Text className="text-4xl">📚</Text>
                    </View>
                    <Text className="text-gray-900 font-poppins-semibold text-xl mb-2 text-center">
                      No Classes Today
                    </Text>
                    <Text className="text-gray-600 font-poppins text-center text-sm leading-5">
                      Enjoy your free day! Take some time to relax or catch up
                      on other activities.
                    </Text>
                  </View>
                ) : (
                  schedule.map((tmr, idx) => (
                    <View
                      key={idx}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-50"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-black  font-poppins-semibold">
                          {tmr.start} - {tmr.end}
                        </Text>
                        {tmr.type === "break" ? (
                          <View className="bg-yellow-600 px-5 py-2 rounded-full">
                            <Text className="text-yellow-200 font-poppins-semibold text-sm">
                              Break
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-blue-600 px-5 py-2 rounded-full">
                            <Text className="text-blue-200 font-poppins-semibold text-sm">
                              Class
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Quick Actions */}
            <View className="mb-20">
              <Text className="text-gray-900 font-poppins-semibold text-lg mb-4">
                Quick Actions
              </Text>
              <View className="flex-row space-x-4">
                <Pressable
                  onPress={() => expoRouter.push("/(authenticated)/messages")}
                  className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-50 active:bg-gray-200"
                >
                  <Text className="text-center text-4xl mb-2">💬</Text>
                  <Text className="text-gray-900 font-poppins-semibold text-center text-sm">
                    Messages
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {/* Status Menu Overlay */}
          {showStatusMenu && (
            <View className="absolute inset-0 bg-black/20 justify-end">
              <Pressable className="flex-1" onPress={handleCloseMenu} />
              <View className="bg-white rounded-t-3xl p-6 pb-8">
                <Text className="text-gray-900 font-poppins-bold text-xl mb-6 text-center font-poppins">
                  Change Status
                </Text>

                <View className="space-y-3">
                  {statusOptions.map((status) => (
                    <Pressable
                      key={status.label}
                      className="flex-row items-center p-4 rounded-xl active:bg-gray-200"
                      onPress={() => selectStatus(status.label)}
                    >
                      <Text className="flex-1 text-gray-900 font-poppins-semibold text-lg">
                        {status.label}
                      </Text>
                      <View
                        className={`${status.color} w-4 h-4 rounded-full`}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {showMenu && (
            <Animated.View
              style={animatedStyle}
              className="absolute inset-0 bg-black/20 justify-end"
            >
              <Pressable className="flex-1" onPress={handleCloseMenu} />
              <Animated.View
                style={translateYStyle}
                className="bg-white rounded-t-3xl p-6 pb-8"
              >
                <Text className="text-gray-900 font-poppins-bold text-xl mb-6 text-center font-poppins">
                  Menu
                </Text>

                <View className="space-y-3">
                  <Pressable
                    className="flex-row items-center p-4 rounded-xl active:bg-gray-200"
                    onPress={() => handleShowStatusModifier()}
                  >
                    <Text className="flex-1 text-gray-900 font-poppins-semibold text-lg">
                      Change Status
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-row items-center p-4 rounded-xl active:bg-gray-200"
                    onPress={() => handleLogout()}
                  >
                    <Text className="flex-1 text-gray-900 font-poppins-semibold text-lg">
                      Logout
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            </Animated.View>
          )}

          {/* Comeback Time Modal */}
          {showComebackModal && (
            <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
              <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <Text className="text-gray-900 font-poppins-semibold text-xl mb-4 text-center">
                  Set Comeback Time
                </Text>

                <Text className="text-gray-600 font-poppins text-center mb-6">
                  You're setting your status to "{pendingStatus}". Please
                  specify when you'll be back.
                </Text>

                <View className="mb-6">
                  <Text className="text-gray-700 font-poppins-semibold mb-3">
                    Come back in:
                  </Text>

                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <Text className="text-gray-600 font-poppins text-sm mb-2">
                        Hours
                      </Text>
                      <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 font-poppins text-lg text-center"
                        placeholder="0"
                        value={comebackHours}
                        onChangeText={setComebackHours}
                        keyboardType="numeric"
                        maxLength={2}
                        autoFocus={true}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-gray-600 font-poppins text-sm mb-2">
                        Minutes
                      </Text>
                      <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 font-poppins text-lg text-center"
                        placeholder="0"
                        value={comebackMinutes}
                        onChangeText={(text) => {
                          // Limit minutes to 0-59
                          const num = Number(text);
                          if (text === "" || (num >= 0 && num <= 59)) {
                            setComebackMinutes(text);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    className="flex-1 bg-gray-200 rounded-xl py-3 active:bg-gray-300"
                    onPress={handleCancelComeback}
                  >
                    <Text className="text-gray-700 font-poppins-semibold text-center">
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    className={`flex-1 rounded-xl py-3 ${
                      (Number(comebackHours) || 0) > 0 ||
                      (Number(comebackMinutes) || 0) > 0
                        ? "bg-blue-600 active:bg-blue-700"
                        : "bg-gray-300"
                    }`}
                    onPress={handleConfirmComeback}
                    disabled={
                      (Number(comebackHours) || 0) === 0 &&
                      (Number(comebackMinutes) || 0) === 0
                    }
                  >
                    <Text
                      className={`font-poppins-semibold text-center ${
                        (Number(comebackHours) || 0) > 0 ||
                        (Number(comebackMinutes) || 0) > 0
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      Confirm
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Logout Confirmation Modal */}
          {showLogoutModal && (
            <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
              <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <Text className="text-gray-900 font-poppins-semibold text-xl mb-4 text-center">
                  Confirm Logout
                </Text>

                <Text className="text-gray-600 font-poppins text-center mb-6">
                  Are you sure you want to logout? You'll need to sign in again
                  to access your dashboard.
                </Text>

                <View className="flex-row gap-2">
                  <Pressable
                    className="flex-1 bg-gray-200 rounded-xl py-3 active:bg-gray-300"
                    onPress={handleCancelLogout}
                  >
                    <Text className="text-gray-700 font-poppins-semibold text-center">
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    className="flex-1 bg-red-600 rounded-xl py-3 active:bg-red-700"
                    onPress={handleConfirmLogout}
                  >
                    <Text className="text-white font-poppins-semibold text-center">
                      Logout
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Floating Action Button */}
          {!showStatusMenu &&
            !showMenu &&
            !showComebackModal &&
            !showLogoutModal && (
              <Pressable
                className={`absolute bottom-8 right-6 bg-blue-600 w-16 h-16 rounded-full shadow-lg items-center justify-center active:scale-95`}
                onPress={handleShowMenu}
              >
                <Text className="text-white text-2xl">-</Text>
              </Pressable>
            )}
        </View>
      )}
    </>
  );
}
