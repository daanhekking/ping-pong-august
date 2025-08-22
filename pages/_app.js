import '../styles/globals.css'
import { DataProvider } from '../lib/DataContext'

export default function App({ Component, pageProps }) {
  return (
    <DataProvider>
      <Component {...pageProps} />
    </DataProvider>
  )
}
