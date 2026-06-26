import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { vitePrerenderPlugin } from "vite-prerender-plugin";
// @ts-expect-error - plain .mjs data module without type declarations
import { EXTRA_PRERENDER_ROUTES } from "./scripts/prerender-routes.mjs";

// Static prerender is mandatory for production social previews: WhatsApp/FB/X
// read raw HTML only, so route-specific OG/Twitter tags must be server-visible.
// Dev server remains fast; non-production builds can opt in with PRERENDER=true.
// Routes are intentionally limited to anonymous-safe SEO pages — no dashboard,
// auth, or user-personalised flows. Detail pages remain CSR + sitemap.
const PRERENDER_ROUTES = [
  "/",
  "/quizzes",
  "/exams",
  "/exams/mdcat",
  "/exams/ecat",
  "/exams/nts",
  "/exams/fpsc",
  "/exams/ppsc",
  "/exams/css",
  "/exams/pms",
  "/about",
  "/contact",
  "/faq",
  "/reviews",
  "/past-papers",
  "/tools",
  "/editorial-policy",
  "/blog",
  "/boards",
  "/scholarships",
  "/jobs",
  "/p",
  // SEO landing pages
  "/mdcat-syllabus",
  "/mdcat-past-papers",
  "/ppsc-past-papers",
  "/fpsc-past-papers",
  "/css-mcqs-practice",
  "/ecat-preparation",
  "/nust-entry-test",
  "/punjab-university-entry-test",
  "/comsats-entry-test",
  "/sindh-universities-entry-test",
  "/engineering-universities-entry-test",
  "/pst-sst-test-preparation",
  "/9th-class-mcqs",
  "/board-mcqs",
  "/pak-army-test",
  "/paf-test",
  "/asf-test",
  "/forces-jobs-tests",
  // Synchronous-render detail pages (tools w/ SEOHead, /p/:slug programmatic,
  // static /subject-content/:id). DB-driven detail pages are handled by
  // scripts/inject-meta.mjs after the build instead.
  ...EXTRA_PRERENDER_ROUTES,
];

export default defineConfig(({ mode }) => {
  const shouldPrerender = process.env.PRERENDER === 'true' || mode === 'production';

  return {
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
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
    mode === 'development' && componentTagger(),
    shouldPrerender && vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
      additionalPrerenderRoutes: PRERENDER_ROUTES,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
