import type React from "react";
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "AI 소설 작가",
    description: "AI와 함께 창작하는 소설 작성 플랫폼",
    generator: "hyunsoo",
};

function LayoutContent({children}: {children: React.ReactNode}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                    <LayoutContent>{children}</LayoutContent>
                </ThemeProvider>
            </body>
        </html>
    );
}
