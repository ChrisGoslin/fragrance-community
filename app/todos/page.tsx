import { createClient } from '@/utils/supabase/server'

export default async function TodosPage() {
  const supabase = await createClient()
  const { data: todos } = await supabase.from('todos').select()

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
