/**
 * Composable for human verification
 *
 * @returns {Object} Verification state and methods
 *
 * @example
 * const { verifyHuman, isVerifying, verified, error } = useVerifyHuman()
 *
 * const handleVerify = async () => {
 *   const result = await verifyHuman()
 *   if (result) {
 *     console.log('✅ User verified!')
 *   }
 * }
 */
export declare const useVerifyHuman: () => {
    verifyHuman: () => Promise<boolean>;
    reset: () => void;
    isVerifying: import("vue").Ref<boolean, boolean>;
    verified: import("vue").Ref<boolean, boolean>;
    error: import("vue").Ref<string | null, string | null>;
};
