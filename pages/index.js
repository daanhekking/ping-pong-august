import dynamic from 'next/dynamic'
import Head from 'next/head'

const Scoreboard = dynamic(() => import('../components/Scoreboard'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>Ping Pong Scoreboard</title>
        <meta name="description" content="Scoreboard app converted to Next.js" />
      </Head>
      <main className="container">
        <h1>Ping Pong — Scoreboard</h1>
        <Scoreboard />
      </main>
    </>
  )
}
