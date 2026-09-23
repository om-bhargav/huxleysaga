import type { PropsWithChildren } from "react"
import LenisProvider from "./LenisProvider";
import { ThemeProvider } from "./ThemeProvider";
interface Props extends PropsWithChildren { }
export default function Providers({ children }: Props) {
    return <ThemeProvider attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
        forcedTheme="dark"
    >
        <LenisProvider />
        {children}
    </ThemeProvider>
}