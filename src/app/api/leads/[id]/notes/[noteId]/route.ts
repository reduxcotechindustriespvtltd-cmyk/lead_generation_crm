import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api-response";
import { updateNoteSchema } from "@/lib/validations/leads";

export async function PATCH(request: Request, ctx: RouteContext<"/api/leads/[id]/notes/[noteId]">) {
  try {
    const session = await requireUser();
    const { noteId } = await ctx.params;
    const input = updateNoteSchema.parse(await request.json());

    const note = await db.note.findUnique({ where: { id: noteId } });
    if (!note) return jsonError("Note not found", 404);
    if (note.userId !== session.sub && session.role === "SALES_EXECUTIVE") {
      return jsonError("You can only edit your own notes", 403);
    }

    const updated = await db.note.update({
      where: { id: noteId },
      data: { content: input.content },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ note: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
