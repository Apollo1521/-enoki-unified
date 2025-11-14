import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export default function useEnokiMutator() {
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => {
      const response = axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/app-login`,
        {
          email,
          password,
        }
      );
      console.log("Success. ", process.env.EXPO_PUBLIC_API_URL);
      return response;
    },
  });

  const changeStatus = useMutation({
    mutationFn: ({
      id,
      newStatus,
      cmb,
    }: {
      id: string;
      newStatus: string;
      cmb?: number;
    }) => {
      const response = axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/change-status`,
        {
          teacherId: id,
          status: newStatus,
          cmb,
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
        exact: false,
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: ({ messageId }: { messageId: string }) => {
      const response = axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/mark-as-read`,
        {
          messageId,
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
        exact: false,
      });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: ({ messageId }: { messageId: string }) => {
      const response = axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/delete-message`,
        {
          messageId,
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
        exact: false,
      });
    },
  });

  const appendPushNotificationToken = useMutation({
    mutationFn: ({
      teacherId,
      token,
    }: {
      teacherId: string;
      token: string;
    }) => {
      const response = axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/append-push-notification-token`,
        {
          teacherId,
          token,
        }
      );
      return response;
    },
  });

  const appLogout = useMutation({
    mutationFn: ({ teacherId }: { teacherId: string }) => {
      const response = axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/app-logout`,
        {
          teacherId,
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const onboardingPassword = useMutation({
    mutationFn: ({
      teacherId,
      password,
    }: {
      teacherId: string;
      password: string;
    }) => {
      const response = axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/onboarding-password`,
        {
          teacherId,
          password,
        }
      );
      return response;
    },
  });

  return {
    login,
    changeStatus,
    markAsRead,
    deleteMessage,
    appendPushNotificationToken,
    appLogout,
    onboardingPassword,
  };
}
