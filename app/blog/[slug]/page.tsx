import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/header";
import { getBlogPost, getAllBlogSlugs, BLOG_POSTS, type BlogSection } from "@/lib/blog-posts";
import { ArrowLeft, Clock, Tag, ArrowRight, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";

export const revalidate = 86400;

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Nie znaleziono — ElektroSmart PRO" };

  return {
    title: `${post.title} | ElektroSmart PRO`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["ElektroSmart PRO"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "heading":
      return (
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3">
          {section.text}
        </h2>
      );
    case "paragraph":
      return (
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
          {section.text}
        </p>
      );
    case "list":
      return (
        <ul className="space-y-2 mb-4">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className="my-5 flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-4">
          <AlertTriangle className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{section.text}</p>
        </div>
      );
    case "tip":
      return (
        <div className="my-5 flex items-start gap-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 px-4 py-4">
          <Lightbulb className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
          <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">{section.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.category === post.category
  ).slice(0, 2);

  const otherRelated = related.length < 2
    ? BLOG_POSTS.filter((p) => p.slug !== post.slug && !related.find(r => r.slug === p.slug)).slice(0, 2 - related.length)
    : [];

  const allRelated = [...related, ...otherRelated].slice(0, 2);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-orange-500 transition-colors">Strona główna</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-orange-500 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300 truncate">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="w-3 h-3" />
              {post.readTime} min czytania
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            {post.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span>ElektroSmart PRO</span>
            <span>·</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
        </header>

        {/* Content */}
        <div className="prose-custom">
          {post.content.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}
        </div>

        {/* Back link */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Wróć do bloga
          </Link>
        </div>
      </article>

      {/* Related posts */}
      {allRelated.length > 0 && (
        <section className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
              Podobne artykuły
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {allRelated.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md transition-all"
                >
                  <span className="text-xs font-semibold text-orange-500">{related.category}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug line-clamp-2">
                    {related.title}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mt-auto">
                    <Clock className="w-3 h-3" />
                    {related.readTime} min
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              Wypróbuj ElektroSmart PRO
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Profesjonalne kosztorysy elektryczne. Demo bezpłatne.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shadow-md shadow-orange-500/20"
          >
            Zacznij za darmo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
