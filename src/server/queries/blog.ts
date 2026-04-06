import { prisma } from "@/lib/db";

export async function listPublishedBlogPosts(take = 50, skip = 0) {
  return prisma.blogPost.findMany({
    where: { published: true, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
      author: { select: { email: true } },
    },
  });
}

export async function countPublishedBlogPosts() {
  return prisma.blogPost.count({
    where: { published: true, publishedAt: { not: null } },
  });
}

export async function getPublishedBlogPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: {
      author: { select: { email: true } },
    },
  });
}

export async function listBlogPostsForAdmin() {
  return prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { email: true } },
    },
  });
}

export async function getBlogPostForAdmin(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: { select: { email: true } },
    },
  });
}

export async function listRecentBlogPosts(take = 3) {
  return prisma.blogPost.findMany({
    where: { published: true, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
    },
  });
}

export async function listBlogSlugs() {
  return prisma.blogPost.findMany({
    where: { published: true, publishedAt: { not: null } },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });
}
