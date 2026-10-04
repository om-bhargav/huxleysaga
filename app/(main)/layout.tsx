"use client";
import Layout from '@/components/layout/Layout'
import { ChildrenProps } from '@/types/children'
import ShatterLoader from "@/components/shared/Loader";
import { AppStore } from '@/store/AppContext';
import UniverseGate from '@/components/shared/UniverseGate';

export default function layout({ children }: ChildrenProps) {
    const { ready } = AppStore();
    return (
        ready ?
            <UniverseGate>
                <Layout>
                    {children}
                </Layout>
            </UniverseGate> :
            <ShatterLoader />
    )
}
