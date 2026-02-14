import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { SidebarProvider } from "./context/SidebarContext"
import "./index.css"
import App from "./App.tsx"
import { Toaster } from "sonner"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </BrowserRouter>
  </StrictMode >
)
