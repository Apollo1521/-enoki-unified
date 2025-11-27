import { NotificationProvider } from "@/components/EnokiNotification";
import { SocketProvider } from "@/components/SocketContext";
import { LoadProvider } from "@/components/UseLoaderContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <NotificationProvider>
      <LoadProvider>
        <SocketProvider>
          <Stack>
            <Stack.Screen
              name="dashboard/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="messages/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="attendance/index"
              options={{ headerShown: false }}
            />
          </Stack>
        </SocketProvider>
      </LoadProvider>
    </NotificationProvider>
  );
}
