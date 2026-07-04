export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        MainButton: {
          hide: () => void;
          show: () => void;
        };
        HapticFeedback?: {
          notificationOccurred: (type: "success" | "error" | "warning") => void;
        };
      };
    };
  }
}
