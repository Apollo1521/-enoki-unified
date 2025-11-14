// src/context/AuthContext.tsx
import useEnokiMutator from "@/hooks/useEnokiMutator";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import useEnokiAuthenticationPlatform from "../hooks/useEnokiAuthenticationPlatform";

interface AuthContextType {
  userId: any;
  loading: boolean;
  __login: (email: string, password: string) => Promise<void>;
  __logout: () => void;
  currentUser: any;
  setCurrentUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType>();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const expoRouter = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { login, appLogout } = useEnokiMutator();
  const { fetchSecure, removeSecure, saveSecure } =
    useEnokiAuthenticationPlatform();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // while checking token

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await fetchSecure("enokiAuthToken");

        if (!token) {
          setUserId(null);
        } else {
          const userData: any = jwtDecode(token);
          setUserId(userData.id);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);
  const __login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const rst = await login.mutateAsync({ email, password });

    await saveSecure("enokiAuthToken", rst.data.token);
    const userData: any = jwtDecode(rst.data.token);

    setUserId(userData.id);
    if (userData?.rds) {
      expoRouter.replace("/onboarding");
    } else {
      expoRouter.replace("/(authenticated)/dashboard");
    }
    return;
  };

  const __logout = async () => {
    await removeSecure("enokiAuthToken");
    setUserId(null);

    await appLogout.mutateAsync({ teacherId: currentUser.teacher.id });
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        loading,
        __login,
        __logout,
        currentUser,
        setCurrentUser,
      }}
    >
      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="black" />
        </View>
      )}

      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
