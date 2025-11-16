import { Toaster as Sonner } from "sonner@2.0.3"

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        style: {
          background: '#ffffff',
          color: '#2d2520',
          border: '1px solid #e8ddd4',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 30px rgba(217, 119, 87, 0.15)',
        },
      }}
    />
  )
}
