import dynamic from 'next/dynamic'
import Head from 'next/head'
import Layout from '../components/Layout'

const MonthlyWinners = dynamic(() => import('../components/MonthlyWinners'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>Monthly Challenges - Ping Pong</title>
        <meta name="description" content="See this month's challenge winners" />
      </Head>
      <Layout activePage="monthly-winners">
        <MonthlyWinners />
      </Layout>
    </>
  )
}
