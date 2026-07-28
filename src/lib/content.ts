import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CASE_STUDIES_DIR = path.join(process.cwd(), "src/content/case-studies");

export type CaseStudyFrontmatter = {
  title: string;
  slug: string;
  client: string;
  role: string;
  year: string;
  summary: string;
  tags: string[];
  order: number;
  featured?: boolean;
  /** Optional — swap in a real photo later; falls back to a generated cover. */
  coverImage?: string;
};

export type CaseStudy = CaseStudyFrontmatter & { content: string };

function readCaseStudyFile(fileName: string): CaseStudy {
  const filePath = path.join(CASE_STUDIES_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { ...(data as CaseStudyFrontmatter), content };
}

export function getAllCaseStudies(): CaseStudy[] {
  const files = fs.readdirSync(CASE_STUDIES_DIR).filter((file) => file.endsWith(".mdx"));
  return files.map(readCaseStudyFile).sort((a, b) => a.order - b.order);
}

export function getFeaturedCaseStudies(): CaseStudy[] {
  return getAllCaseStudies().filter((caseStudy) => caseStudy.featured);
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return getAllCaseStudies().find((caseStudy) => caseStudy.slug === slug);
}
