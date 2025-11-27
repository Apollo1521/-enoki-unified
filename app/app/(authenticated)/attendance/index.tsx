import { useAuth } from "@/components/AuthContext";
import { useLoader } from "@/components/UseLoaderContext";
import useEnokiMutator from "@/hooks/useEnokiMutator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function Attendance() {
  const { show: showLoader, hide: hideLoader } = useLoader();
  const navi = useNavigation();
  const { currentUser } = useAuth();
  const { markAsRead, deleteMessage } = useEnokiMutator();
  const queryClient = useQueryClient();

  const [expandedAttendance, setExpandedAttendance] = useState<string | null>(
    null
  );

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const isWithin10Minutes = (createdAt: string): boolean => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes <= 10;
  };

  const handleAttendanceUpdate = async (callId: string, attended: boolean) => {
    try {
      showLoader();
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/mark-attendance`, {
        callId,
        attended,
      });
      console.log(`Attendance ${callId} updated to ${attended}`);
      queryClient.invalidateQueries({
        exact: false,
        queryKey: ["attendance-calls"],
      });
      hideLoader();
    } catch (error) {
      console.error(`Failed to update attendance ${callId}:`, error);
      hideLoader();
    }
  };

  const toggleAttendanceExpansion = (callId: string) => {
    setExpandedAttendance(expandedAttendance === callId ? null : callId);
  };

  const {
    data: attendanceCallsData = [],
    isPending: attendanceCallsPending,
    isError: attendanceCallsIsError,
    refetch: attendanceCallsRefetch,
  } = useQuery({
    queryFn: async () => {
      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/get-attendance-calls`,
        { id: currentUser?.id }
      );
      return res.data.list;
    },
    queryKey: ["attendance-calls"],
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Show all calls but track which ones are within 10 minutes for button visibility
  const recentAttendanceCalls = attendanceCallsData;

  useFocusEffect(
    useCallback(() => {
      attendanceCallsRefetch();
    }, [attendanceCallsRefetch])
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 pb-3 px-6 pb-5">
        {/* Back Button */}
        <View className="mb-4">
          <Pressable
            className="flex-row items-center active:opacity-70"
            onPress={() => navi.goBack()}
          >
            <Text className="text-blue-600 font-poppins-semibold text-lg mr-2">
              ←
            </Text>
          </Pressable>
        </View>

        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="text-gray-600 font-poppins text-sm">
              Attendance Calls
            </Text>
            <Text className="text-gray-900 font-poppins-semibold text-2xl">
              Active Calls
            </Text>
          </View>
          <View className="max-h-[30px] items-end">
            <Text className="text-gray-500 font-poppins text-xs">
              Actionable
            </Text>
            <Text className="text-gray-700 font-poppins-semibold">
              {
                recentAttendanceCalls.filter(
                  (call: any) =>
                    !call.attended && isWithin10Minutes(call.created_at)
                ).length
              }
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Attendance Calls Overview */}
        {!attendanceCallsPending && (
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 mb-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 font-poppins text-sm mb-1">
                  All Calls
                </Text>
                <Text className="text-gray-900 font-poppins-semibold text-xl">
                  {recentAttendanceCalls.length}
                </Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="items-center">
                  <Text className="text-amber-600 font-poppins-semibold text-lg">
                    {
                      recentAttendanceCalls.filter(
                        (call: any) =>
                          !call.attended && isWithin10Minutes(call.created_at)
                      ).length
                    }
                  </Text>
                  <Text className="text-gray-500 font-poppins text-xs">
                    Actionable
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-emerald-600 font-poppins-semibold text-lg">
                    {
                      recentAttendanceCalls.filter((call: any) => call.attended)
                        .length
                    }
                  </Text>
                  <Text className="text-gray-500 font-poppins text-xs">
                    Attended
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Attendance Calls List */}
        <View className="mb-6">
          <Text className="text-gray-900 font-poppins-semibold text-lg mb-4">
            Recent Attendance Calls
          </Text>

          {attendanceCallsPending && (
            <View className="flex flex-row gap-5 mx-auto font-poppins-semibold">
              <ActivityIndicator color="black" />
              <Text className="font-[500]">Fetching attendance calls...</Text>
            </View>
          )}

          {!attendanceCallsPending && recentAttendanceCalls.length === 0 && (
            <View className="bg-white rounded-2xl p-8 shadow-sm border border-gray-50 items-center">
              <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
                <Text className="text-blue-500 text-3xl">📞</Text>
              </View>
              <Text className="text-gray-900 font-poppins-semibold text-xl mb-2 text-center">
                No Attendance Calls
              </Text>
              <Text className="text-gray-500 font-poppins text-sm text-center leading-5 mb-4">
                No attendance calls have been made yet. When students call for
                attendance, they'll appear here.
              </Text>
              <View className="bg-blue-50 rounded-xl p-4 w-full">
                <Text className="text-blue-700 font-poppins-semibold text-sm mb-1 text-center">
                  💡 Tip
                </Text>
                <Text className="text-blue-600 font-poppins text-xs text-center">
                  Action buttons are only available for calls within 10 minutes.
                </Text>
              </View>
            </View>
          )}

          {!attendanceCallsPending && recentAttendanceCalls.length > 0 && (
            <View className="flex flex-col gap-3">
              {recentAttendanceCalls.map((call: any) => {
                const isActionable =
                  !call.attended && isWithin10Minutes(call.calledAt);

                return (
                  <Pressable
                    key={call.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border ${
                      call.attended
                        ? "border-emerald-100 bg-emerald-50/30"
                        : isActionable
                          ? "border-amber-100 bg-amber-50/30"
                          : "border-gray-100 bg-gray-50/30"
                    } active:bg-gray-50`}
                    onPress={() => toggleAttendanceExpansion(call.id)}
                  >
                    <View className="flex-row items-start justify-between">
                      {/* Left side - Call Info */}
                      <View className="flex-1 mr-4">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-gray-900 font-poppins-semibold text-base">
                            {call.student.enokiAcct.name}
                          </Text>
                          <View
                            className={`w-2 h-2 rounded-full ml-2 ${
                              call.attended
                                ? "bg-emerald-600"
                                : isActionable
                                  ? "bg-amber-600"
                                  : "bg-gray-400"
                            }`}
                          />
                        </View>
                        <Text className="text-gray-600 font-poppins text-sm mb-1">
                          Called at: {formatTimeAgo(call.calledAt)}
                        </Text>
                        <Text className="text-gray-500 font-poppins text-xs">
                          Status:{" "}
                          {call.attended
                            ? "Attended"
                            : isActionable
                              ? "Pending"
                              : "Expired"}
                        </Text>
                      </View>

                      {/* Right side - Time */}
                      <View className="items-end">
                        <Text className="text-gray-500 font-poppins text-xs mb-1">
                          {formatTimeAgo(call.calledAt)}
                        </Text>
                        <View
                          className={`rounded-full px-2 py-1 ${
                            call.attended
                              ? "bg-emerald-100"
                              : isActionable
                                ? "bg-amber-100"
                                : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`font-poppins-semibold text-xs ${
                              call.attended
                                ? "text-emerald-700"
                                : isActionable
                                  ? "text-amber-700"
                                  : "text-gray-600"
                            }`}
                          >
                            {call.attended ? "✓" : isActionable ? "⏰" : "❌"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Expanded Attendance Actions - Only show if actionable */}
                    {expandedAttendance === call.id && isActionable && (
                      <View className="mt-4 pt-4 border-t border-gray-100">
                        <Text className="text-gray-500 font-poppins-semibold text-xs mb-3">
                          Mark Attendance
                        </Text>
                        <View className="flex-row gap-3">
                          <Pressable
                            className="flex-1 bg-emerald-500 py-3 rounded-xl active:bg-emerald-600"
                            onPress={() =>
                              handleAttendanceUpdate(call.id, true)
                            }
                            disabled={call.attended}
                          >
                            <Text className="text-white font-poppins-semibold text-center">
                              {call.attended ? "✓ Attended" : "Mark Attended"}
                            </Text>
                          </Pressable>
                        </View>
                        <Text className="text-gray-400 font-poppins text-xs text-center mt-3">
                          Calls expire after 10 minutes
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="mb-20" />
      </ScrollView>
    </View>
  );
}
