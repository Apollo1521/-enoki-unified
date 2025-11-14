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

interface Message {
  message: string;
  sentAt: string;
  isRead: boolean;
  id: string;
}

interface MessageGroup {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  messages: Message[];
}

export default function Messages() {
  const { show: showLoader, hide: hideLoader } = useLoader();
  const navi = useNavigation();
  const { currentUser } = useAuth();
  const { markAsRead, deleteMessage } = useEnokiMutator();
  const queryClient = useQueryClient();

  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

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

  const handleLongPress = async (messageId: string) => {
    try {
      showLoader();
      await markAsRead.mutateAsync({ messageId });
      console.log(`Message ${messageId} marked as read successfully`);
      hideLoader();
    } catch (error) {
      console.error(`Failed to mark message ${messageId} as read:`, error);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMessage = async () => {
    if (messageToDelete) {
      try {
        showLoader();
        await deleteMessage.mutateAsync({ messageId: messageToDelete });
        console.log(`Message ${messageToDelete} deleted successfully`);
        hideLoader();
      } catch (error) {
        console.error(`Failed to delete message ${messageToDelete}:`, error);
      }
    }
    setDeleteModalVisible(false);
    setMessageToDelete(null);
  };

  const cancelDeleteMessage = () => {
    setDeleteModalVisible(false);
    setMessageToDelete(null);
  };

  const toggleMessageExpansion = (studentId: string) => {
    setExpandedMessage(expandedMessage === studentId ? null : studentId);
  };

  const {
    data: messagesData = [],
    isPending: messagesPending,
    isError: messagesIsError,
    refetch: messagesRefetch,
  } = useQuery({
    queryFn: async () => {
      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/get-teacher-messages`,
        { teacherId: currentUser.teacher.id }
      );
      return res.data.data;
    },
    queryKey: ["messages", currentUser.teacher.id],
    enabled: !!currentUser,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Calculate unread count from MessageGroup data
  const unreadCount = messagesData.reduce(
    (count: number, group: MessageGroup) => {
      return count + group.messages.filter((msg) => !msg.isRead).length;
    },
    0
  );

  useFocusEffect(
    useCallback(() => {
      messagesRefetch();
    }, [messagesRefetch])
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
              Student Messages
            </Text>
            <Text className="text-gray-900 font-poppins-semibold text-2xl">
              Inbox
            </Text>
          </View>
          <View className="max-h-[30px] items-end">
            <Text className="text-gray-500 font-poppins text-xs">Unread</Text>
            <Text className="text-gray-700 font-poppins-semibold">
              {unreadCount}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Messages Overview */}
        {!messagesPending && (
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 mb-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 font-poppins text-sm mb-1">
                  Total Messages
                </Text>
                <Text className="text-gray-900 font-poppins-semibold text-xl">
                  {messagesData.length}
                </Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="items-center">
                  <Text className="text-red-600 font-poppins-semibold text-lg">
                    {unreadCount}
                  </Text>
                  <Text className="text-gray-500 font-poppins text-xs">
                    Unread
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-emerald-600 font-poppins-semibold text-lg">
                    {messagesData.reduce(
                      (total: number, group: MessageGroup) =>
                        total + group.messages.length,
                      0
                    ) - unreadCount}
                  </Text>
                  <Text className="text-gray-500 font-poppins text-xs">
                    Read
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Messages List */}
        <View className="mb-6">
          <Text className="text-gray-900 font-poppins-semibold text-lg mb-4">
            Recent Messages
          </Text>

          {messagesPending && (
            <View className="flex flex-row gap-5 mx-auto font-poppins-semibold">
              <ActivityIndicator color="black" />{" "}
              <Text className="font-[500]">Fetching messages...</Text>
            </View>
          )}

          {!messagesPending && messagesData.length === 0 && (
            <View className="bg-white rounded-2xl p-8 shadow-sm border border-gray-50 items-center">
              <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
                <Text className="text-blue-500 text-3xl">📬</Text>
              </View>
              <Text className="text-gray-900 font-poppins-semibold text-xl mb-2 text-center">
                No Messages Yet
              </Text>
              <Text className="text-gray-500 font-poppins text-sm text-center leading-5 mb-4">
                You haven't received any messages from students yet. When
                students send you messages, they'll appear here.
              </Text>
              <View className="bg-blue-50 rounded-xl p-4 w-full">
                <Text className="text-blue-700 font-poppins-semibold text-sm mb-1 text-center">
                  💡 Tip
                </Text>
                <Text className="text-blue-600 font-poppins text-xs text-center">
                  Students can reach out to you through the messaging system for
                  questions about assignments, course content, or general
                  inquiries.
                </Text>
              </View>
            </View>
          )}

          {!messagesPending && messagesData.length > 0 && (
            <View className="flex flex-col gap-3">
              {messagesData.map((messageGroup: MessageGroup) => {
                const hasUnreadMessages = messageGroup.messages.some(
                  (msg: Message) => !msg.isRead
                );
                const latestMessage =
                  messageGroup.messages[messageGroup.messages.length - 1];

                return (
                  <Pressable
                    key={messageGroup.studentId}
                    className={`bg-white rounded-xl p-4 shadow-sm border ${
                      hasUnreadMessages
                        ? "border-blue-100 bg-blue-50/30"
                        : "border-gray-50"
                    } active:bg-gray-50`}
                    onPress={() =>
                      toggleMessageExpansion(messageGroup.studentId)
                    }
                    onLongPress={() => handleLongPress(latestMessage.id)}
                    delayLongPress={500}
                  >
                    <View className="flex-row items-start justify-between">
                      {/* Left side - Student Info */}
                      <View className="flex-1 mr-4">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-gray-900 font-poppins-semibold text-base">
                            {messageGroup.studentName}
                          </Text>
                          {hasUnreadMessages && (
                            <View className="w-2 h-2 bg-blue-600 rounded-full ml-2" />
                          )}
                        </View>
                        <Text className="text-gray-600 font-poppins text-sm mb-1">
                          {messageGroup.courseName}
                        </Text>
                        <Text className="text-gray-500 font-poppins text-xs">
                          {messageGroup.studentEmail}
                        </Text>
                      </View>

                      {/* Right side - Time and Count */}
                      <View className="items-end">
                        <Text className="text-gray-500 font-poppins text-xs mb-1">
                          {formatTimeAgo(latestMessage.sentAt)}
                        </Text>
                        {messageGroup.messages.length > 1 && (
                          <View className="bg-gray-100 rounded-full px-2 py-1">
                            <Text className="text-gray-600 font-poppins-semibold text-xs">
                              {messageGroup.messages.length}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Expanded Message Content */}
                    {expandedMessage === messageGroup.studentId && (
                      <View className="mt-4 pt-4 border-t border-gray-100">
                        <View className="space-y-3">
                          <Text className="text-gray-500 font-poppins-semibold text-xs mb-2">
                            Message Thread ({messageGroup.messages.length}{" "}
                            messages)
                          </Text>
                          {messageGroup.messages.map(
                            (msg: Message, index: number) => (
                              <Pressable
                                key={index}
                                className="bg-gray-50 rounded-lg p-3 mb-2"
                                onLongPress={() => handleLongPress(msg.id)}
                                delayLongPress={500}
                              >
                                <Text className="text-gray-700 font-poppins text-sm leading-5 mb-2">
                                  {msg.message}
                                </Text>
                                <View className="flex-row justify-between items-center">
                                  <Text className="text-gray-400 font-poppins text-xs">
                                    {formatTimeAgo(msg.sentAt)}
                                  </Text>
                                  <View className="flex-row items-center gap-2">
                                    <Text
                                      className={`font-poppins text-xs ${
                                        msg.isRead
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {msg.isRead ? "✓ Read" : "● Unread"}
                                    </Text>
                                    <Pressable
                                      className="bg-red-100 px-2 py-1 rounded active:bg-red-200"
                                      onPress={() =>
                                        handleDeleteMessage(msg.id)
                                      }
                                    >
                                      <Text className="text-red-600 font-poppins text-xs">
                                        Delete
                                      </Text>
                                    </Pressable>
                                  </View>
                                </View>
                              </Pressable>
                            )
                          )}
                        </View>

                        <View className="mt-3 flex-row justify-between items-center">
                          <Text className="text-gray-400 font-poppins text-xs">
                            Long press individual messages to mark as read
                          </Text>
                        </View>
                        <View className="mt-3 flex-row justify-center">
                          <Text className="text-gray-400 font-poppins text-xs text-center">
                            Use individual delete buttons above to remove
                            specific messages
                          </Text>
                        </View>
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

      {/* Delete Confirmation Modal */}
      {deleteModalVisible && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-gray-900 font-poppins-semibold text-xl mb-2 text-center">
              Delete Message
            </Text>
            <Text className="text-gray-600 font-poppins text-sm mb-6 text-center leading-5">
              Are you sure you want to delete this message? This action cannot
              be undone.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 bg-gray-100 py-3 rounded-xl active:bg-gray-200"
                onPress={cancelDeleteMessage}
              >
                <Text className="text-gray-700 font-poppins-semibold text-center">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 bg-red-500 py-3 rounded-xl active:bg-red-600"
                onPress={confirmDeleteMessage}
              >
                <Text className="text-white font-poppins-semibold text-center">
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
