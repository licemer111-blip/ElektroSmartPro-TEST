import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { getAllBlogSlugs, getBlogPost } from "@/lib/blog-posts";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Artykuł nie znaleziony" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://elektrosmart.pro/blog/${post.slug}` },
  };
}

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Wróć do bloga
      </Link>

      <Badge variant="outline" className="mb-4">{post.category}</Badge>
      <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">
        {post.title}
      </h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400 mb-8">
        <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{post.date}</span>
        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.readTime} min</span>
      </div>

      <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
        {post.content.map((block, index) => {
          if (block.type === "heading") {
            return <h2 key={index} className="text-2xl font-bold text-slate-900 dark:text-slate-100 pt-6">{block.text}</h2>;
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="list-disc pl-6 space-y-1">
                {(block.items ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            );
          }
          if (block.type === "callout" || block.type === "tip") {
            return (
              <p key={index} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm">
                {block.text}
              </p>
            );
          }
          return <p key={index}>{block.text}</p>;
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <Button asChild variant="outline">
          <Link href="/blog" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Wróć do wszystkich artykułów
          </Link>
        </Button>
      </div>
    </article>
  );
}
