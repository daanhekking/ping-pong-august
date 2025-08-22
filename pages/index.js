import dynamic from 'next/dynamic'
import Head from 'next/head'
import Layout from '../components/Layout'

const Leaderboard = dynamic(() => import('../components/Leaderboard'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>Ping Pong Leaderboard</title>
        <meta name="description" content="Track your ping pong matches and climb the rankings" />
      </Head>
      <Layout activePage="leaderboard">
        <Leaderboard />
      </Layout>
    </>
  )
}
