"use client";
import Layout from '@/components/layout/Layout'
import { ChildrenProps } from '@/types/children'
import UniverseGate from '@/components/shared/UniverseGate';
import LenisProvider from "@/components/providers/LenisProvider";

export default function layout({ children }: ChildrenProps) {
    return (
        <>

            <LenisProvider />
            <UniverseGate>
                <Layout>
                    {children}
                </Layout>
            </UniverseGate>
        </>
    )
}
