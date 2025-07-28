import React, { createContext, useContext, useState, useCallback } from "react";
import { useToast } from "./ToastContext";

const ErrorContext = createContext();

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}

export function ErrorProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const toast = useToast();

  // 에러 추가
  const addError = useCallback(
    (error, context = "") => {
      const errorId = Date.now();
      const errorObj = {
        id: errorId,
        message: error.message || "알 수 없는 오류가 발생했습니다.",
        context,
        timestamp: new Date(),
        code: error.code || "UNKNOWN_ERROR",
      };

      setErrors((prev) => [...prev, errorObj]);

      // 에러 타입별 토스트 메시지
      let toastMessage = errorObj.message;

      if (error.code === "permission-denied") {
        toastMessage = "권한이 없습니다. 다시 로그인해 주세요.";
      } else if (error.code === "network-request-failed") {
        toastMessage = "네트워크 연결을 확인해 주세요.";
      } else if (error.code === "unavailable") {
        toastMessage = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
      }

      toast.error(toastMessage);

      // 개발 환경에서 콘솔 로깅
      if (process.env.NODE_ENV === "development") {
        console.error("에러 발생:", { error, context, errorObj });
      }

      return errorId;
    },
    [toast]
  );

  // 에러 제거
  const removeError = useCallback((errorId) => {
    setErrors((prev) => prev.filter((error) => error.id !== errorId));
  }, []);

  // 모든 에러 제거
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 안전한 비동기 실행 함수
  const safeAsync = useCallback(
    async (asyncFn, context = "", options = {}) => {
      const {
        showLoading = true,
        showSuccessToast = false,
        successMessage = "작업이 완료되었습니다.",
        retryCount = 0,
        retryDelay = 1000,
      } = options;

      if (showLoading) setIsLoading(true);

      let lastError = null;

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const result = await asyncFn();

          if (showLoading) setIsLoading(false);
          if (showSuccessToast) toast.success(successMessage);

          return result;
        } catch (error) {
          lastError = error;

          // 재시도 가능한 에러인지 확인
          const isRetryableError =
            error.code === "unavailable" ||
            error.code === "network-request-failed" ||
            error.name === "NetworkError";

          if (attempt < retryCount && isRetryableError) {
            // 재시도 전 딜레이
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * (attempt + 1))
            );
            continue;
          }

          // 최종 실패
          break;
        }
      }

      if (showLoading) setIsLoading(false);
      const errorId = addError(lastError, context);
      throw new Error(JSON.stringify({ ...lastError, errorId }));
    },
    [addError, toast]
  );

  // Firebase 전용 안전 실행 함수
  const safeFirebase = useCallback(
    async (firebaseFn, context = "", options = {}) => {
      return safeAsync(firebaseFn, context, {
        retryCount: 2,
        retryDelay: 1000,
        ...options,
      });
    },
    [safeAsync]
  );

  const value = {
    // 상태
    isLoading,
    errors,
    hasErrors: errors.length > 0,

    // 에러 관리
    addError,
    removeError,
    clearErrors,

    // 안전 실행
    safeAsync,
    safeFirebase,

    // 로딩 상태 수동 관리
    setIsLoading,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}
