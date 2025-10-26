import { ref } from "vue";
import { verifyHuman as verifyHumanFunc } from "../../index";
export const useVerifyHuman = () => {
  const isVerifying = ref(false);
  const verified = ref(false);
  const error = ref(null);
  const verifyHuman = async () => {
    isVerifying.value = true;
    error.value = null;
    try {
      const result = await verifyHumanFunc();
      if (result) {
        verified.value = true;
      }
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Verification failed";
      return false;
    } finally {
      isVerifying.value = false;
    }
  };
  const reset = () => {
    verified.value = false;
    error.value = null;
    isVerifying.value = false;
  };
  return {
    verifyHuman,
    reset,
    isVerifying,
    verified,
    error
  };
};
