import { expect, test } from "bun:test";
import { boardNotes } from "./board-notes";

test("board notes retain formulas and exam questions", () => {
  expect(boardNotes("# Algebra\n- **Balance** both sides\n- $x = 4$\n\n1. Solve $x+2=6$"))
    .toEqual(["Algebra", "**Balance** both sides", "$x = 4$", "1. Solve $x+2=6$"]);
});