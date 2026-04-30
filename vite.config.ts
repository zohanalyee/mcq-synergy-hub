import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Conservative chunking: only split heavy, leaf-style libs that do NOT
        // need to share a React context with the main bundle. Splitting React,
        // React-DOM, Radix, or React Query into separate chunks broke prod
        // (white screen) because of init-order / multiple-React-instance issues.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('framer-motion')) return 'framer';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('pdf-lib') || id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
          if (id.includes('exceljs')) return 'excel';
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('micromark') || id.includes('mdast') || id.includes('hast')) return 'markdown';
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
