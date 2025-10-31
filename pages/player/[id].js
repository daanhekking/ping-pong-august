import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

const PlayerDetail = dynamic(() => import('../../components/PlayerDetail'), { ssr: false })

export default function PlayerPage() {
  const router = useRouter()
  const { id } = router.query

  return (
    <>
      <Head>
        <title>Player Profile - Ping Pong</title>
        <meta name="description" content="View player stats, awards, and match history" />
      </Head>
      <Layout activePage="">
        <PlayerDetail playerId={id} />
      </Layout>
    </>
  )
}

