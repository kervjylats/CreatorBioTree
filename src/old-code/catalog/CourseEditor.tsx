/** TODO: Add purpose docstring. */
"use client";

import type { CourseModule, CourseLesson } from "@/types";

interface CourseEditorProps {
  courseId: string;
  modules: CourseModule[];
  lessons: CourseLesson[];
  onChange: (modules: CourseModule[], lessons: CourseLesson[]) => void;
}

let moduleCounter = 1000;
const genModuleId = () => `mock-module-${++moduleCounter}`;
let lessonCounter = 10000;
const genLessonId = () => `mock-lesson-${++lessonCounter}`;

export function CourseEditor({ courseId, modules, lessons, onChange }: CourseEditorProps) {
  const getLessons = (moduleId: string) =>
    lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.sort_order - b.sort_order);

  const addModule = () => {
    const newModule: CourseModule = {
      id: genModuleId(),
      course_id: courseId,
      creator_id: "",
      title: "New Module",
      description: "",
      sort_order: modules.length + 1,
      created_at: new Date().toISOString(),
    };
    onChange([...modules, newModule], [...lessons]);
  };

  const updateModule = (id: string, patch: Partial<CourseModule>) => {
    onChange(
      modules.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      lessons
    );
  };

  const removeModule = (id: string) => {
    onChange(
      modules.filter((m) => m.id !== id),
      lessons.filter((l) => l.module_id !== id)
    );
  };

  const addLesson = (moduleId: string) => {
    const moduleLessons = getLessons(moduleId);
    const newLesson: CourseLesson = {
      id: genLessonId(),
      module_id: moduleId,
      creator_id: "",
      title: "New Lesson",
      description: "",
      file_url: null,
      duration_minutes: null,
      sort_order: moduleLessons.length + 1,
      created_at: new Date().toISOString(),
    };
    onChange(modules, [...lessons, newLesson]);
  };

  const updateLesson = (id: string, patch: Partial<CourseLesson>) => {
    onChange(
      modules,
      lessons.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const removeLesson = (id: string) => {
    onChange(
      modules,
      lessons.filter((l) => l.id !== id)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          Course modules ({modules.length})
        </span>
        <button
          type="button"
          onClick={addModule}
          className="px-2.5 py-1 text-[10px] bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium"
        >
          + Add module
        </button>
      </div>

      {modules.length === 0 && (
        <p className="text-[10px] text-gray-400 italic text-center py-6">
          No modules yet. Add a module to structure your course content.
        </p>
      )}

      <div className="space-y-3">
        {modules
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((mod) => {
            const modLessons = getLessons(mod.id);
            return (
              <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Module header */}
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[9px] text-gray-400 font-mono w-4">{mod.sort_order}</span>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => updateModule(mod.id, { title: e.target.value })}
                    className="flex-1 px-2 py-0.5 text-xs font-medium border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeModule(mod.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Module description */}
                <div className="px-2.5 py-1.5">
                  <textarea
                    value={mod.description ?? ""}
                    onChange={(e) => updateModule(mod.id, { description: e.target.value })}
                    placeholder="Module description (optional)"
                    rows={1}
                    className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                </div>

                {/* Lessons list */}
                <div className="px-2.5 pb-2 space-y-1.5">
                  {modLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-start gap-1.5 bg-white border border-gray-100 rounded-lg p-2">
                      <span className="text-[9px] text-gray-400 font-mono mt-1 w-4 shrink-0">{lesson.sort_order}</span>
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                          className="w-full px-1.5 py-0.5 text-[10px] font-medium border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300"
                        />
                        <textarea
                          value={lesson.description ?? ""}
                          onChange={(e) => updateLesson(lesson.id, { description: e.target.value })}
                          placeholder="Lesson description (optional)"
                          rows={1}
                          className="w-full px-1.5 py-0.5 text-[9px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={lesson.file_url ?? ""}
                            onChange={(e) => updateLesson(lesson.id, { file_url: e.target.value || null })}
                            placeholder="File URL (optional)"
                            className="flex-1 px-1.5 py-0.5 text-[9px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                          <input
                            type="number"
                            min={0}
                            value={lesson.duration_minutes ?? ""}
                            onChange={(e) => updateLesson(lesson.id, { duration_minutes: parseInt(e.target.value) || null })}
                            placeholder="Mins"
                            className="w-12 px-1.5 py-0.5 text-[9px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLesson(lesson.id)}
                        className="text-red-300 hover:text-red-500 text-[9px] mt-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addLesson(mod.id)}
                    className="w-full py-1 text-[9px] text-indigo-500 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50"
                  >
                    + Add lesson
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
