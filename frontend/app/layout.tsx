import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
export const metadata={title:"Zero Downtime",description:"AI-powered industrial operations intelligence"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>}
