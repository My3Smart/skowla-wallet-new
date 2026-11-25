import { useSession } from "@/lib/auth";
import { IMG } from "@/lib/images";

/** Display info for the signed-in parent (CBS user or demo account). */
export function useParentProfile() {
  const s = useSession();
  const isDemo = s?.email === "sarah@skowla.my";
  return {
    name: s?.name ?? "",
    shortName: s?.shortName ?? "",
    email: s?.email ?? "",
    photo: isDemo ? IMG.sarah : undefined,
  };
}
