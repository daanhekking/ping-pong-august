import dynamic from 'next/dynamic'
import Head from 'next/head'
import Layout from '../../components/Layout'

const ExportAwards = dynamic(() => import('../../components/ExportAwards'), { ssr: false })

export default function ExportAwardsPage() {
  return (
    <>
      <Head>
        <title>Export Awards CSV - Admin</title>
        <meta name="description" content="Generate CSV for historical awards" />
      </Head>
      <Layout activePage="">
        <ExportAwards />
      </Layout>
    </>
  )
}

