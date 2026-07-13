import { createClient } from '@/lib/supabase/client'
import type { TrainingQuiz, TrainingQuizQuestion, TrainingQuizAttempt } from '@/types/hr'

export async function getQuizzes(courseId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_quizzes')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order')

  if (error) throw error
  return (data || []) as TrainingQuiz[]
}

export async function getQuizWithQuestions(quizId: string) {
  const supabase = createClient()
  const { data: quiz, error } = await supabase
    .from('training_quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (error) throw error

  const { data: questions } = await supabase
    .from('training_quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order')

  return { ...quiz, questions: questions || [] } as TrainingQuiz
}

export async function createQuiz(quiz: Partial<TrainingQuiz>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_quizzes')
    .insert([quiz])
    .select()
    .single()

  if (error) throw error
  return data as TrainingQuiz
}

export async function updateQuiz(id: string, updates: Partial<TrainingQuiz>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_quizzes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingQuiz
}

export async function deleteQuiz(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('training_quizzes').delete().eq('id', id)
  if (error) throw error
}

export async function addQuestion(question: Partial<TrainingQuizQuestion>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_quiz_questions')
    .insert([question])
    .select()
    .single()

  if (error) throw error

  // Update question count
  if (question.quiz_id) {
    const { data: questions } = await supabase
      .from('training_quiz_questions')
      .select('id')
      .eq('quiz_id', question.quiz_id)

    await supabase
      .from('training_quizzes')
      .update({ question_count: questions?.length || 0 })
      .eq('id', question.quiz_id)
  }

  return data as TrainingQuizQuestion
}

export async function updateQuestion(id: string, updates: Partial<TrainingQuizQuestion>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_quiz_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingQuizQuestion
}

export async function deleteQuestion(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('training_quiz_questions').delete().eq('id', id)
  if (error) throw error
}

export async function submitQuizAttempt(quizId: string, employeeId: string, answers: Record<string, string>) {
  const supabase = createClient()

  // Get quiz and questions
  const quiz = await getQuizWithQuestions(quizId)
  if (!quiz.questions) throw new Error('No questions found')

  // Check attempt count
  const { data: existingAttempts } = await supabase
    .from('training_quiz_attempts')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('employee_id', employeeId)

  if ((existingAttempts?.length || 0) >= quiz.max_attempts) {
    throw new Error('Maximum attempts reached')
  }

  // Auto-grade
  let totalPoints = 0
  let earnedPoints = 0
  for (const q of quiz.questions) {
    totalPoints += q.points
    if (answers[q.id] === q.correct_answer) {
      earnedPoints += q.points
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const passed = score >= quiz.passing_score

  const { data, error } = await supabase
    .from('training_quiz_attempts')
    .insert([{
      quiz_id: quizId,
      employee_id: employeeId,
      score,
      total_points: totalPoints,
      passed,
      answers,
      completed_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) throw error
  return data as TrainingQuizAttempt
}

export async function getAttempts(quizId: string, employeeId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('training_quiz_attempts')
    .select(`
      *,
      employee:profiles(id, first_name, last_name, department, avatar_url)
    `)
    .eq('quiz_id', quizId)
    .order('completed_at', { ascending: false })

  if (employeeId) query = query.eq('employee_id', employeeId)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as TrainingQuizAttempt[]
}

export async function getLeaderboard(quizId: string) {
  const attempts = await getAttempts(quizId)

  // Best score per employee
  const bestScores: Record<string, TrainingQuizAttempt> = {}
  for (const a of attempts) {
    if (!bestScores[a.employee_id] || (a.score || 0) > (bestScores[a.employee_id].score || 0)) {
      bestScores[a.employee_id] = a
    }
  }

  return Object.values(bestScores)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((a, i) => ({ ...a, rank: i + 1 }))
}
