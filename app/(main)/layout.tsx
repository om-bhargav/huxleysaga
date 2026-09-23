import Layout from '@/components/layout/Layout'
import { ChildrenProps } from '@/types/children'

export default function layout({ children }: ChildrenProps) {
    return (
        <Layout>
            {children}
        </Layout>
    )
}
