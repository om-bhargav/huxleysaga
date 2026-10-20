import type { PropsWithChildren } from "react"
import { ThemeProvider } from "./ThemeProvider";
import SwrProvider from "./SwrProvider";
interface Props extends PropsWithChildren { }
export default function Providers({ children }: Props) {
    return <ThemeProvider attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
        forcedTheme="dark"
    >
        <SwrProvider>{children}</SwrProvider>
    </ThemeProvider>
}