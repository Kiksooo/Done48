"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserForAction, type SessionUser } from "@/lib/rbac";
import { blogPostSchema, type BlogPostInput } from "@/schemas/blog";

function ensureAdmin(user: SessionUser | null): SessionUser {
  if (!user || user.role !== Role.ADMIN) {
    throw new Error("Доступ запрещён");
  }
  return user;
}

export async function createBlogPostAction(input: BlogPostInput) {
  const user = ensureAdmin(await getSessionUserForAction());
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  const data = parsed.data;
  const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { ok: false as const, error: "Slug уже занят — выберите другой" };
  }

  await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      coverImageUrl: data.coverImageUrl || null,
      published: data.published,
      publishedAt: data.published ? new Date() : null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      authorId: user.id,
    },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { ok: true as const };
}

export async function updateBlogPostAction(id: string, input: BlogPostInput) {
  ensureAdmin(await getSessionUserForAction());
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  const data = parsed.data;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, error: "Статья не найдена" };
  }

  const slugConflict = await prisma.blogPost.findFirst({
    where: { slug: data.slug, id: { not: id } },
  });
  if (slugConflict) {
    return { ok: false as const, error: "Slug уже занят другой статьёй" };
  }

  const wasPublished = existing.published;
  await prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      coverImageUrl: data.coverImageUrl || null,
      published: data.published,
      publishedAt: data.published && !wasPublished ? new Date() : existing.publishedAt,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
    },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  return { ok: true as const };
}

export async function deleteBlogPostAction(id: string) {
  ensureAdmin(await getSessionUserForAction());

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return { ok: false as const, error: "Статья не найдена" };

  await prisma.blogPost.delete({ where: { id } });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  return { ok: true as const };
}

export async function toggleBlogPostPublishedAction(id: string) {
  ensureAdmin(await getSessionUserForAction());

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return { ok: false as const, error: "Статья не найдена" };

  const newPublished = !post.published;
  await prisma.blogPost.update({
    where: { id },
    data: {
      published: newPublished,
      publishedAt: newPublished && !post.publishedAt ? new Date() : post.publishedAt,
    },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  return { ok: true as const };
}
