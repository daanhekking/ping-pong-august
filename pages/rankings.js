import dynamic from 'next/dynamic'
import Head from 'next/head'
import Layout from '../components/Layout'

const Leaderboard = dynamic(() => import('../components/Leaderboard'), { ssr: false })

export default function RankingsPage() {
  return (
    <>
      <Head>
        <title>Total Ranking - Ping Pong</title>
        <meta name="description" content="Track your ping pong matches and climb the rankings" />
      </Head>
      <Layout activePage="rankings">
        <Leaderboard />
      </Layout>
    </>
  )
}

