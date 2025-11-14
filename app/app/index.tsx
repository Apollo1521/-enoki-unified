import { useAuth } from "@/components/AuthContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { userId, loading } = useAuth();

  if (loading) return null;

  return !userId ? (
    <Redirect href="/login" />
  ) : (
    <Redirect href="/(authenticated)/dashboard" />
  );
}
