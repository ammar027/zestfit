import React, { createContext, useContext, useState } from "react"
import Toast from "../components/Toast"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastData {
  visible: boolean
  message: string
  type: ToastType
  duration: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void
}

const initialToastData: ToastData = {
  visible: false,
  message: "",
  type: "info",
  duration: 3000,
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
})

export const useToast = () => useContext(ToastContext)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastData, setToastData] = useState<ToastData>(initialToastData)

  const showToast = (message: string, type: ToastType = "info", duration: number = 3000) => {
    setToastData({
      visible: true,
      message,
      type,
      duration,
    })
  }

  const hideToast = () => {
    setToastData((prev) => ({
      ...prev,
      visible: false,
    }))
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast visible={toastData.visible} message={toastData.message} type={toastData.type} duration={toastData.duration} onDismiss={hideToast} />
    </ToastContext.Provider>
  )
}

// Helper functions for convenience
export const showSuccessToast = (message: string, duration?: number) => {
  const { showToast } = useToast()
  showToast(message, "success", duration)
}

export const showErrorToast = (message: string, duration?: number) => {
  const { showToast } = useToast()
  showToast(message, "error", duration)
}

export const showInfoToast = (message: string, duration?: number) => {
  const { showToast } = useToast()
  showToast(message, "info", duration)
}

export const showWarningToast = (message: string, duration?: number) => {
  const { showToast } = useToast()
  showToast(message, "warning", duration)
}
