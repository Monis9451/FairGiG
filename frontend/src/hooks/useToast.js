import useToastStore from '@/store/toastStore'

export const useToast = () => {
  const pushToast = useToastStore((state) => state.pushToast)

  return {
    success: (message, options) => pushToast('success', message, options),
    error: (message, options) => pushToast('error', message, options),
    info: (message, options) => pushToast('info', message, options),
  }
}

export default useToast
