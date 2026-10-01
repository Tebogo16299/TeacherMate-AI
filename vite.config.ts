import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: "/TeacherMate-AI/",
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});
