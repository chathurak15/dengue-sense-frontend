import { redirect } from "next/navigation";

/** Public citizen reporting was removed; keep the old URL from breaking. */
export default function ReportPage() {
  redirect("/");
}
