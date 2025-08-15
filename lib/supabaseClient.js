import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olcpnzpikeejzgitbvkp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY3BuenBpa2VlanpnaXRidmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDQ0NzIsImV4cCI6MjA3MDIyMDQ3Mn0.od-MbxVK1peVMFtLVGAKBDZ4Btv0MfJ_KXFLqcLywbA'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
        