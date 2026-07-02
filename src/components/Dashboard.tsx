import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, ListTodo, Calendar, Trash2, Check, Edit2, Undo, Circle, CheckCircle } from "lucide-react";
import { Task, User } from "../types";
import ProfileDropdown from "./ProfileDropdown";
import toast from "react-hot-toast";

interface DashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
  onOpenSettings: (tab: "profile" | "settings") => void;
}

export default function Dashboard({ user, token, onLogout, onOpenSettings }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [taskInput, setTaskInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load date
  const todayDateStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Fetch tasks
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/tasks", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tasks");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          loadLocalFallback();
        }
      })
      .catch((err) => {
        console.error("Error loading tasks", err);
        loadLocalFallback();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const loadLocalFallback = () => {
    const saved = localStorage.getItem(`todo_tasks_${user.id}`);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
        return;
      } catch (e) {
        console.error("Local fallback parse error", e);
      }
    }
    // Default starter tasks for a brand-new user
    const starterTasks: Task[] = [
      { id: "1", text: "✨ Welcome to your isolated To-Do space!", completed: false, createdAt: Date.now() - 3600000 },
      { id: "2", text: "🌸 Create or edit tasks; only you can see them!", completed: false, createdAt: Date.now() - 1800000 },
      { id: "3", text: "🎯 Feel free to complete tasks by clicking the circle", completed: true, createdAt: Date.now() - 900000 },
    ];
    setTasks(starterTasks);
    saveTasksToServer(starterTasks);
  };

  // Save tasks to server & local fallback
  const saveTasksToServer = (updatedTasks: Task[]) => {
    localStorage.setItem(`todo_tasks_${user.id}`, JSON.stringify(updatedTasks));
    fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tasks: updatedTasks }),
    }).catch((err) => {
      console.error("Failed to sync tasks to server", err);
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = taskInput.trim();
    if (!trimmed) return;

    const newTask: Task = {
      id: "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    const newTaskList = [newTask, ...tasks];
    setTasks(newTaskList);
    saveTasksToServer(newTaskList);
    setTaskInput("");
    toast.success("Task added successfully! 🚀");
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          toast.success("Task completed! 🎉");
        } else {
          toast("Task marked active 💫", { icon: "✨" });
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    setTasks(updated);
    saveTasksToServer(updated);
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    const updated = tasks.filter((t) => t.id !== id);
    if (editingId === id) {
      setEditingId(null);
    }
    setTasks(updated);
    saveTasksToServer(updated);
    const previewText = taskToDelete ? `"${taskToDelete.text.substring(0, 18)}..."` : "Task";
    toast.error(`Deleted ${previewText} 🗑️`);
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.text);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      handleDeleteTask(id);
      return;
    }

    const updated = tasks.map((t) => (t.id === id ? { ...t, text: trimmed } : t));
    setTasks(updated);
    saveTasksToServer(updated);
    setEditingId(null);
    toast.success("Task updated! ✏️");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleClearCompleted = () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    const updated = tasks.filter((t) => !t.completed);
    setTasks(updated);
    saveTasksToServer(updated);
    toast.success(`Cleared ${completedCount} completed tasks 🧹`);
  };

  const handleEditInputKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  return (
    <div className="w-full h-full flex flex-col justify-between" id="dashboard-container">
      <div>
        {/* Header */}
        <div className="header flex items-center justify-between mb-6">
          <div className="header-left flex items-center gap-2.5">
            <div className="header-icon p-2 rounded-xl bg-white/10 border border-white/10 text-rose-200 flex">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h1 className="title text-xl font-bold tracking-tight text-white leading-tight">To-Do App</h1>
              <p className="subtitle text-[10px] sm:text-xs text-rose-200/60 font-medium tracking-wide flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{todayDateStr}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {totalCount > 0 && (
              <span className="stats-badge text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-100 border border-rose-500/25 font-semibold">
                {completedCount}/{totalCount} Done
              </span>
            )}
            <ProfileDropdown user={user} onLogout={onLogout} onOpenSettings={onOpenSettings} />
          </div>
        </div>

        {/* Form Input Area */}
        <form onSubmit={handleAddTask} className="task-form flex gap-2.5 mb-6">
          <div className="input-wrap relative flex-1">
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Add a new task..."
              className="task-input w-full h-11 pl-4 pr-10 rounded-full bg-white/10 border border-white/10 text-sm text-white placeholder-rose-200/40 outline-none focus:border-rose-400/50 focus:bg-white/15 focus:ring-4 focus:ring-rose-400/5 transition-all"
              id="dashboard-task-input"
            />
            {taskInput && (
              <button
                type="button"
                onClick={() => {
                  setTaskInput("");
                  inputRef.current?.focus();
                }}
                className="clear-input-btn absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-rose-200/40 hover:text-white rounded-full transition-colors cursor-pointer"
                title="Clear input"
                id="clear-task-input-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!taskInput.trim()}
            className="add-btn h-11 w-11 flex items-center justify-center rounded-full transition-all shrink-0 bg-white/5 border border-white/5 text-white/30 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
            style={{
              backgroundColor: taskInput.trim() ? "rgba(251, 113, 133, 0.4)" : "rgba(255, 255, 255, 0.05)",
              borderColor: taskInput.trim() ? "rgba(252, 165, 165, 0.3)" : "rgba(255, 255, 255, 0.05)",
              color: taskInput.trim() ? "#ffffff" : "rgba(255, 255, 255, 0.3)",
            }}
            id="add-task-btn"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {/* Tab Filters */}
        <div className="filters flex gap-1.5 p-1 mb-5 rounded-2xl bg-white/5 border border-white/5">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-xl transition-all cursor-pointer ${
                filter === f
                  ? "bg-rose-500/30 text-white border border-rose-300/20 shadow-sm"
                  : "text-rose-200/60 hover:text-white hover:bg-white/5"
              }`}
              id={`filter-${f}-btn`}
            >
              {f} {f === "active" && activeCount > 0 && `(${activeCount})`}
            </button>
          ))}
        </div>

        {/* List of Tasks */}
        <div className="task-list-wrap max-h-[290px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-rose-400/20 border-t-rose-400 animate-spin" />
              <p className="text-xs text-rose-200/40 font-medium">Syncing space...</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <ul className="task-list flex flex-col gap-2.5 list-none">
                {filteredTasks.map((task) => {
                  const isEditing = editingId === task.id;
                  return (
                    <motion.li
                      key={task.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: task.completed ? 0.7 : 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`task-item flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all group ${
                        task.completed ? "border-white/5 bg-white/5" : ""
                      }`}
                      id={`task-item-${task.id}`}
                    >
                      <div className="task-content flex items-center gap-3 flex-1 min-w-0">
                        {/* Circle Toggle button */}
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className="toggle-btn shrink-0 text-white cursor-pointer"
                          title="Toggle complete"
                          id={`toggle-task-${task.id}`}
                        >
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-rose-400/90" />
                          ) : (
                            <Circle className="w-5 h-5 text-white/30 hover:text-rose-300/70 transition-colors" />
                          )}
                        </button>

                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleEditInputKeyDown(e, task.id)}
                            onBlur={() => handleSaveEdit(task.id)}
                            className="task-edit-input flex-1 text-sm bg-white/15 text-white rounded-lg px-2 py-1 outline-none border border-rose-400/50"
                            autoFocus
                            id={`edit-input-${task.id}`}
                          />
                        ) : (
                          <span
                            onDoubleClick={() => handleStartEdit(task)}
                            className={`task-text text-sm font-medium text-white truncate pr-2 select-text cursor-text leading-relaxed ${
                              task.completed ? "line-through text-white/40" : ""
                            }`}
                            id={`task-text-${task.id}`}
                          >
                            {task.text}
                          </span>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="task-actions flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(task.id)}
                              className="save-btn p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/35 border border-emerald-500/30 transition-all cursor-pointer"
                              title="Save"
                              id={`save-edit-btn-${task.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="cancel-btn p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
                              title="Cancel"
                              id={`cancel-edit-btn-${task.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(task)}
                              className="edit-btn p-1.5 rounded-lg bg-white/5 text-rose-200/70 hover:text-white hover:bg-rose-500/20 border border-white/5 hover:border-rose-400/10 transition-all cursor-pointer"
                              title="Edit task"
                              id={`start-edit-btn-${task.id}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="delete-btn p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 border border-rose-500/20 transition-all cursor-pointer"
                              title="Delete task"
                              id={`delete-task-btn-${task.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.li>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="empty-state py-12 px-4 flex flex-col items-center justify-center text-center"
                    id="dashboard-empty-state"
                  >
                    <div className="empty-icon w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-rose-300/30">
                      <ListTodo className="w-8 h-8" />
                    </div>
                    <h3 className="empty-title text-sm font-semibold text-white/80">No tasks found</h3>
                    <p className="empty-text text-xs text-rose-200/40 mt-1 max-w-[220px] leading-relaxed">
                      {filter === "completed"
                        ? "You haven't completed any tasks yet."
                        : filter === "active"
                        ? "Everything is finished! Good job! ✨"
                        : "Type a task above and press Enter to start."}
                    </p>
                  </motion.div>
                )}
              </ul>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer */}
      {totalCount > 0 && (
        <div className="footer mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-rose-200/50" id="dashboard-footer">
          <span>
            {activeCount} {activeCount === 1 ? "task" : "tasks"} remaining
          </span>
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="clear-completed-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-rose-200/60 hover:text-rose-100 hover:bg-rose-500/20 hover:border-rose-500/10 transition-all cursor-pointer focus:outline-none"
              id="clear-completed-tasks-btn"
            >
              <Undo className="w-3.5 h-3.5 shrink-0" />
              <span>Clear Completed</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
