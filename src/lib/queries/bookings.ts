import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { BookingListQuery } from "@/lib/validations/bookings";

export function buildBookingWhere(query: BookingListQuery): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = {};

  if (query.q) {
    where.OR = [
      { guestName: { contains: query.q, mode: "insensitive" } },
      { phone: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.status) where.status = query.status;
  if (query.leadId) where.leadId = query.leadId;

  return where;
}

export async function listBookings(query: BookingListQuery) {
  const where = buildBookingWhere(query);

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            status: { select: { name: true, color: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    db.booking.count({ where }),
  ]);

  return {
    bookings,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getBookingDetail(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: {
      lead: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: { select: { name: true, color: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
}
