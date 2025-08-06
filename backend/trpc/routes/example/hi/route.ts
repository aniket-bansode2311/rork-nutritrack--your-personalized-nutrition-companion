import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export default protectedProcedure
  .input(z.object({ name: z.string() }))
  .query(({ input, ctx }) => {
    return {
      greeting: `Hello ${input.name}! Your user ID is ${ctx.user.id}`,
      date: new Date(),
    };
  });