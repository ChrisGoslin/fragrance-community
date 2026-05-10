import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TodosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: todos, error } = await supabase.from('todos').select()
  if (error) console.error('todos fetch error:', error.message)

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Todos</h1>
      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.task}</li>
        ))}
      </ul>
    </main>
  )
}
