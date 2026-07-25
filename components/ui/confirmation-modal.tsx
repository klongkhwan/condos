"use client";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
  loadingText?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  type = "danger",
  isLoading = false,
  loadingText = "กำลังดำเนินการ...",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "text-destructive",
          button: "bg-destructive hover:bg-destructive/90",
        };
      case "warning":
        return {
          icon: "text-warning",
          button: "bg-warning hover:bg-warning/90",
        };
      default:
        return {
          icon: "text-info",
          button: "bg-info hover:bg-info/90",
        };
    }
  };

  const styles = getTypeStyles();

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />
        <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md border border-border">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className={`h-6 w-6 mr-3 ${styles.icon}`} />
              <p className="text-foreground">{message}</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/90 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${styles.button}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {loadingText}
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
