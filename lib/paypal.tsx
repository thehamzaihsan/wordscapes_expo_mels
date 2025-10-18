import PayPalModal from "@/app/lib/PayPalModal";
import { loadGuestProgress, saveGuestProgress } from "@/hooks/guest-progress";
import { updateGuestSnapshotFromProgress } from "@/lib/guestSnapshot";
import { mutateLocalStats, syncUser } from "@/lib/sync";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

type PurchaseOption = { usd: number; gems: number };

export function usePayPalPurchase() {
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [pendingOption, setPendingOption] = useState<PurchaseOption | null>(
    null
  );

  const open = useCallback((opt: PurchaseOption) => {
    setPendingOption(opt);
    setAmount(opt.usd);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setPendingOption(null);
  }, []);

  const onSuccess = useCallback(
    async (details: any) => {
      close();
      try {
        const opt = pendingOption;
        if (!opt) return;
        // Add gems locally
        const progress = await loadGuestProgress();
        if (!progress) {
          Alert.alert(
            "Purchase error",
            "Could not load progress to apply purchase."
          );
          return;
        }
        progress.meta.gems = (progress.meta.gems || 0) + opt.gems;
        progress.updatedAt = new Date().toISOString();
        await saveGuestProgress(progress);
        // Mirror into snapshot for future sync/upgrade
        await updateGuestSnapshotFromProgress(progress);

        // If user is authenticated, try to sync immediately
        // syncUser will be a no-op if snapshot has guest id or supabase disabled
        try {
          const {
            data: { session },
          } = await (await import("@/lib/supabase")).supabase.auth.getSession();
          const uid = session?.user?.id;
          if (uid) {
            // mutateLocalStats to update snapshot.stats.gems, then sync
            await mutateLocalStats((s: any) => {
              s.gems = (s.gems || 0) + opt.gems;
            });
            await syncUser(uid);
          }
        } catch (e) {
          // Non-fatal
          console.warn("PayPal: sync attempt failed", e);
        }

        Alert.alert(
          "Purchase successful",
          `Added ${opt.gems} gems to your account.`
        );
      } catch (err) {
        console.warn("PayPal onSuccess handler error", err);
        Alert.alert(
          "Purchase error",
          "An error occurred while finalizing the purchase."
        );
      }
    },
    [close, pendingOption]
  );

  const onCancel = useCallback(() => {
    setVisible(false);
  }, []);

  const Modal = (
    <PayPalModal
      visible={visible}
      amount={amount}
      onRequestClose={() => setVisible(false)}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );

  return {
    open,
    Modal,
  };
}

export default usePayPalPurchase;
