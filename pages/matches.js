import dynamic from 'next/dynamic'
import Head from 'next/head'
import Layout from '../components/Layout'

const AllMatches = dynamic(() => import('../components/AllMatches'), { ssr: false })

export default function MatchesPage() {
  return (
    <>
      <Head>
        <title>All Matches - Ping Pong Scoreboard</title>
        <meta name="description" content="View complete match history and results" />
      </Head>
      <Layout activePage="matches">
        <AllMatches />
      </Layout>
    </>
  )
}
