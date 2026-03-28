import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const BASE_URL = "https://mcqsai.com";
const ITEMS_PER_SITEMAP = 1000;

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function extractClassNumber(levelName: string): string | null {
  const match = levelName.match(/(\d+)/);
  return match ? match[1] : null;
}

const TOOL_PATHS = [
  "/tools/school-attendance-system", "/tools/math", "/tools/age-calculator", "/tools/timer",
  "/tools/gpa-calculator", "/tools/units", "/tools/notes", "/tools/calendar",
  "/tools/islamic-calendar", "/tools/international-calendar",
  "/tools/bmi-calculator", "/tools/percentage-calculator", "/tools/salary-calculator",
  "/tools/emi-calculator", "/tools/tip-calculator", "/tools/loan-calculator",
  "/tools/discount-calculator", "/tools/bmr-calculator", "/tools/duration-calculator",
  "/tools/ratio-calculator", "/tools/speed-calculator", "/tools/area-calculator",
  "/tools/fraction-calculator", "/tools/date-calculator", "/tools/fuel-calculator",
  "/tools/cgpa-calculator", "/tools/gpa-to-percentage", "/tools/percentage-to-gpa",
  "/tools/grade-calculator", "/tools/marks-calculator", "/tools/attendance-calculator",
  "/tools/result-calculator", "/tools/formula-sheet", "/tools/periodic-table",
  "/tools/multiplication-table", "/tools/currency-converter", "/tools/temperature-converter",
  "/tools/roman-converter", "/tools/binary-converter", "/tools/case-converter",
  "/tools/image-resizer", "/tools/image-compressor", "/tools/image-converter",
  "/tools/pdf-compressor", "/tools/pdf-merger", "/tools/pdf-to-text", "/tools/pdf-splitter",
  "/tools/stopwatch", "/tools/world-clock", "/tools/word-counter", "/tools/character-counter",
  "/tools/qr-generator", "/tools/password-generator", "/tools/name-generator",
  "/tools/color-picker", "/tools/random-number", "/tools/equation-solver",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const edgeFnBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-sitemap`;

  try {
    if (type === "static") {
      return new Response(generateStaticSitemap(), { headers: corsHeaders });
    }

    if (type === "tools") {
      return new Response(generateToolsSitemap(), { headers: corsHeaders });
    }

    if (type === "exams") {
      return new Response(generateExamsSitemap(), { headers: corsHeaders });
    }

    if (type === "jobs") {
      const { data: ciJobs } = await supabase
        .from("content_items")
        .select("title, updated_at")
        .eq("category", "job")
        .eq("status", "approved");

      const { data: eoJobs } = await supabase
        .from("external_opportunities")
        .select("title, updated_at")
        .eq("type", "job")
        .eq("status", "approved");

      const allJobs = [
        ...(ciJobs || []).map(j => ({ slug: toSlug(j.title), lastmod: j.updated_at.split("T")[0] })),
        ...(eoJobs || []).map(j => ({ slug: toSlug(j.title), lastmod: j.updated_at.split("T")[0] })),
      ];
      return new Response(generateUrlSetFromSlugs(allJobs, "/jobs/"), { headers: corsHeaders });
    }

    if (type === "scholarships") {
      const { data: ciSchol } = await supabase
        .from("content_items")
        .select("title, updated_at")
        .eq("category", "scholarship")
        .eq("status", "approved");

      const { data: eoSchol } = await supabase
        .from("external_opportunities")
        .select("title, updated_at")
        .eq("type", "scholarship")
        .eq("status", "approved");

      const allSchol = [
        ...(ciSchol || []).map(s => ({ slug: toSlug(s.title), lastmod: s.updated_at.split("T")[0] })),
        ...(eoSchol || []).map(s => ({ slug: toSlug(s.title), lastmod: s.updated_at.split("T")[0] })),
      ];
      return new Response(generateUrlSetFromSlugs(allSchol, "/scholarships/"), { headers: corsHeaders });
    }

    if (type === "blog") {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published");

      return new Response(generateBlogSitemap(posts || []), { headers: corsHeaders });
    }

    if (type === "boards") {
      const { data: topics, error } = await supabase
        .from("topics")
        .select(`
          id, name,
          subjects!inner(id, name,
            levels!inner(id, name,
              educational_systems!inner(id, name, is_active)
            )
          )
        `)
        .eq("subjects.levels.educational_systems.is_active", true);

      if (error) throw error;

      const allUrls: { loc: string; lastmod: string }[] = [];
      const now = new Date().toISOString().split("T")[0];

      for (const topic of topics || []) {
        const subj = (topic as any).subjects;
        const level = subj?.levels;
        const sys = level?.educational_systems;
        if (!sys || !level || !subj) continue;

        const classNum = extractClassNumber(level.name);
        if (!classNum) continue;

        allUrls.push({
          loc: `${BASE_URL}/boards/${toSlug(sys.name)}/class-${classNum}/${toSlug(subj.name)}/${toSlug(topic.name)}`,
          lastmod: now,
        });
      }

      const start = (page - 1) * ITEMS_PER_SITEMAP;
      const slice = allUrls.slice(start, start + ITEMS_PER_SITEMAP);

      return new Response(generateUrlSet(slice), { headers: corsHeaders });
    }

    // Default: sitemap index
    const { count } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true });

    const totalPages = Math.max(1, Math.ceil((count || 0) / ITEMS_PER_SITEMAP));
    const now = new Date().toISOString().split("T")[0];

    const sitemaps: string[] = [
      `<sitemap><loc>${edgeFnBase}?type=static</loc><lastmod>${now}</lastmod></sitemap>`,
      `<sitemap><loc>${edgeFnBase}?type=tools</loc><lastmod>${now}</lastmod></sitemap>`,
      `<sitemap><loc>${edgeFnBase}?type=blog</loc><lastmod>${now}</lastmod></sitemap>`,
    ];

    for (let i = 1; i <= totalPages; i++) {
      sitemaps.push(
        `<sitemap><loc>${edgeFnBase}?type=boards&amp;page=${i}</loc><lastmod>${now}</lastmod></sitemap>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>`;

    return new Response(xml, { headers: corsHeaders });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: corsHeaders,
    });
  }
});

function generateStaticSitemap(): string {
  const now = new Date().toISOString().split("T")[0];
  const pages = [
    { loc: "/", priority: "1.0", freq: "daily" },
    { loc: "/subjects", priority: "0.9", freq: "weekly" },
    { loc: "/quizzes", priority: "0.9", freq: "weekly" },
    { loc: "/custom-syllabus", priority: "0.8", freq: "monthly" },
    { loc: "/mock-tests", priority: "0.8", freq: "weekly" },
    { loc: "/jobs", priority: "0.7", freq: "daily" },
    { loc: "/scholarships", priority: "0.7", freq: "daily" },
    { loc: "/tools", priority: "0.7", freq: "monthly" },
    { loc: "/question-bank", priority: "0.7", freq: "weekly" },
    { loc: "/past-papers", priority: "0.7", freq: "weekly" },
    { loc: "/leaderboard", priority: "0.6", freq: "daily" },
    { loc: "/reviews", priority: "0.6", freq: "weekly" },
    { loc: "/about", priority: "0.5", freq: "monthly" },
    { loc: "/contact", priority: "0.5", freq: "monthly" },
    { loc: "/blog", priority: "0.8", freq: "weekly" },
    { loc: "/faq", priority: "0.7", freq: "monthly" },
    { loc: "/study-guides", priority: "0.7", freq: "weekly" },
    { loc: "/boards", priority: "0.8", freq: "weekly" },
    { loc: "/privacy-policy", priority: "0.3", freq: "yearly" },
    { loc: "/terms-of-service", priority: "0.3", freq: "yearly" },
  ];

  const urls = pages.map(
    (p) =>
      `<url><loc>${BASE_URL}${p.loc}</loc><lastmod>${now}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

function generateToolsSitemap(): string {
  const now = new Date().toISOString().split("T")[0];
  const urls = TOOL_PATHS.map(
    (path) =>
      `<url><loc>${BASE_URL}${path}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

function generateBlogSitemap(posts: { slug: string; updated_at: string }[]): string {
  const urls = posts.map(
    (p) =>
      `<url><loc>${BASE_URL}/blog/${p.slug}</loc><lastmod>${p.updated_at.split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

function generateUrlSet(urls: { loc: string; lastmod: string }[]): string {
  const entries = urls.map(
    (u) =>
      `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}
