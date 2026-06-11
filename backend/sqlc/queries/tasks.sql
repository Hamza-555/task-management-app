-- name: CreateTask :one
INSERT INTO tasks (user_id, title, description, status, priority, due_date)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetTaskByID :one
SELECT * FROM tasks
WHERE id = $1 AND user_id = $2
LIMIT 1;

-- name: ListTasks :many
SELECT *, COUNT(*) OVER() AS total_count
FROM tasks
WHERE user_id = $1
  AND ($2::task_status IS NULL OR status = $2)
  AND ($3::TEXT IS NULL OR title ILIKE '%' || $3 || '%')
ORDER BY
  CASE WHEN $4 = 'due_date'    THEN due_date::TEXT    END ASC,
  CASE WHEN $4 = 'priority'    THEN priority::TEXT    END ASC,
  CASE WHEN $4 = 'created_at'  THEN created_at::TEXT  END DESC,
  created_at DESC
LIMIT $5 OFFSET $6;

-- name: UpdateTask :one
UPDATE tasks
SET
  title       = COALESCE($3, title),
  description = COALESCE($4, description),
  status      = COALESCE($5, status),
  priority    = COALESCE($6, priority),
  due_date    = COALESCE($7, due_date),
  updated_at  = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1 AND user_id = $2;
