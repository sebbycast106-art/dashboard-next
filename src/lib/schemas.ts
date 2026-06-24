import { z } from "zod";

export const ApplicationStatus = z.enum([
  "seen",
  "applied",
  "responded",
  "interview",
  "offer",
  "rejected",
  "archived",
]);

export const LoginSchema = z.object({
  password: z.string().min(1, "Password required"),
});

export const GameCompleteSchema = z
  .object({
    game_id: z.string().optional(),
    gameId: z.string().optional(),
  })
  .refine((d) => d.game_id || d.gameId, { message: "game_id required" });

export const StatusUpdateSchema = z.object({
  status: ApplicationStatus,
});
