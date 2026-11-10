import { redirect } from "next/navigation";
import { DASHBOARD_HOME } from "@/lib/types";

export default function Home() {
  redirect(DASHBOARD_HOME);
}
