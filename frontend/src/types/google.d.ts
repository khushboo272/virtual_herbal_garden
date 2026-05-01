// ──────────────────────────────────────────────────────────
// Google Identity Services — Type Declarations
// ──────────────────────────────────────────────────────────

interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
        }) => void;
        prompt: (callback?: (notification: {
          isNotDisplayed: () => boolean;
          isSkippedMoment: () => boolean;
        }) => void) => void;
        renderButton: (element: HTMLElement, options: object) => void;
        disableAutoSelect: () => void;
      };
    };
  };
}
